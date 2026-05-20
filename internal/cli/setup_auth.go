package cli

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	beeperdesktopapi "github.com/beeper/desktop-api-go/v5"
	"github.com/beeper/desktop-api-go/v5/option"
)

func setupOAuthTarget(opts *globalOptions, t target) (map[string]any, error) {
	timeout := 2 * time.Minute
	if opts.Timeout != "" {
		if parsed, err := time.ParseDuration(opts.Timeout); err == nil {
			timeout = parsed
		}
	}
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()
	token, err := loginWithPKCE(ctx, t.BaseURL, true, timeout)
	if err != nil {
		return nil, err
	}
	auth := &storedAuth{
		AccessToken: token.AccessToken,
		ClientID:    token.ClientID,
		Scope:       token.Scope,
		Source:      "desktop-oauth",
		TokenType:   token.TokenType,
	}
	if token.ExpiresIn > 0 {
		auth.ExpiresAt = time.Now().Add(time.Duration(token.ExpiresIn) * time.Second).UTC().Format(time.RFC3339)
	}
	if err := saveTargetAuth(t, auth); err != nil {
		return nil, err
	}
	t.Auth = auth
	return setupResult(t, "desktop-oauth"), nil
}

func setupEmailTarget(opts *globalOptions, t target, email string, username string) (map[string]any, error) {
	if email == "" {
		return nil, usageError("Email setup requires --email.")
	}
	client := beeperdesktopapi.NewClient(option.WithBaseURL(t.BaseURL), option.WithAccessToken("setup-login-public-client"))
	ctx := context.Background()
	start, err := client.App.Login.Start(ctx)
	if err != nil {
		return nil, err
	}
	if err := client.App.Login.Email(ctx, beeperdesktopapi.AppLoginEmailParams{SetupRequestID: start.SetupRequestID, Email: email}); err != nil {
		return nil, err
	}
	if opts.JSON || !stdinIsTTY() {
		return nil, usageError("Email setup prompts for the verification code. For automation, use `beeper auth email start` and `beeper auth email response`.")
	}
	code, err := promptLine(bufio.NewReader(os.Stdin), os.Stdout, "Email code: ")
	if err != nil {
		return nil, err
	}
	response, err := client.App.Login.Response(ctx, beeperdesktopapi.AppLoginResponseParams{SetupRequestID: start.SetupRequestID, Response: code})
	if err != nil {
		return nil, err
	}
	token := response.Matrix.AccessToken
	if token == "" && response.RegistrationRequired {
		if username == "" {
			username = firstString(response.UsernameSuggestions)
			value, err := promptLine(bufio.NewReader(os.Stdin), os.Stdout, "Username ["+username+"]: ")
			if err != nil {
				return nil, err
			}
			if value != "" {
				username = value
			}
		}
		if username == "" {
			return nil, usageError("Registration requires --username.")
		}
		registered, err := client.App.Login.Register(ctx, beeperdesktopapi.AppLoginRegisterParams{
			AcceptTerms:    true,
			LeadToken:      response.LeadToken,
			SetupRequestID: response.SetupRequestID,
			Username:       username,
		})
		if err != nil {
			return nil, err
		}
		token = registered.Matrix.AccessToken
	}
	if token == "" {
		return nil, usageError("Setup did not return an access token.")
	}
	auth := &storedAuth{AccessToken: token, Source: "manual", TokenType: "Bearer"}
	if err := saveTargetAuth(t, auth); err != nil {
		return nil, err
	}
	t.Auth = auth
	return setupResult(t, "manual"), nil
}

func setupLocalDesktopTarget(t target) (map[string]any, error) {
	session, err := findLocalDesktopSession(t)
	if err != nil {
		return nil, err
	}
	auth := &storedAuth{AccessToken: session.AccessToken, Source: "desktop-db", TokenType: "Bearer"}
	if err := saveTargetAuth(t, auth); err != nil {
		return nil, err
	}
	t.Auth = auth
	result := setupResult(t, "desktop-db")
	result["localDesktop"] = session
	return result, nil
}

type localDesktopSession struct {
	AccessToken   string         `json:"-"`
	DataDir       string         `json:"dataDir"`
	DeviceID      string         `json:"deviceID,omitempty"`
	FirstSyncDone bool           `json:"firstSyncDone,omitempty"`
	Homeserver    string         `json:"homeserver,omitempty"`
	UserID        string         `json:"userID,omitempty"`
	State         map[string]any `json:"-"`
}

func findLocalDesktopSession(t target) (*localDesktopSession, error) {
	dirs := []string{}
	if t.DataDir != "" {
		dirs = append(dirs, t.DataDir)
	}
	dirs = append(dirs, localDesktopDataDirs()...)
	errorsSeen := []string{}
	for _, dir := range dedupeStrings(dirs) {
		state, err := readDesktopKeyValue(dir, "beeperState")
		if err != nil {
			errorsSeen = append(errorsSeen, dir+": "+err.Error())
			continue
		}
		token := stringAny(state["access_token"])
		if token == "" {
			errorsSeen = append(errorsSeen, dir+": missing access_token")
			continue
		}
		return &localDesktopSession{
			AccessToken:   token,
			DataDir:       dir,
			DeviceID:      stringAny(state["device_id"]),
			FirstSyncDone: boolAny(state["first_sync_done"]),
			Homeserver:    stringAny(state["homeserver"]),
			UserID:        stringAny(state["user_id"]),
			State:         state,
		}, nil
	}
	return nil, errors.New("Could not find a signed-in local Beeper Desktop session. " + strings.Join(errorsSeen, "; "))
}

func readDesktopKeyValue(dataDir string, key string) (map[string]any, error) {
	dbPath := filepath.Join(dataDir, "index.db")
	out, err := exec.Command("sqlite3", "-json", dbPath, "SELECT value FROM key_values WHERE key = '"+strings.ReplaceAll(key, "'", "''")+"' LIMIT 1").Output()
	if err != nil {
		return nil, err
	}
	var rows []struct {
		Value string `json:"value"`
	}
	if err := json.Unmarshal(out, &rows); err != nil {
		return nil, err
	}
	if len(rows) == 0 || rows[0].Value == "" {
		return nil, errors.New("missing " + key)
	}
	var result map[string]any
	if err := json.Unmarshal([]byte(rows[0].Value), &result); err != nil {
		return nil, err
	}
	return result, nil
}

func localDesktopDataDirs() []string {
	if value := os.Getenv("BEEPER_USER_DATA_DIR"); value != "" {
		return []string{value}
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return nil
	}
	switch runtime.GOOS {
	case "darwin":
		appSupport := filepath.Join(home, "Library", "Application Support")
		out := []string{filepath.Join(appSupport, "BeeperTexts")}
		if entries, err := os.ReadDir(appSupport); err == nil {
			for _, entry := range entries {
				if entry.IsDir() && strings.HasPrefix(entry.Name(), "BeeperTexts-") {
					out = append(out, filepath.Join(appSupport, entry.Name()))
				}
			}
		}
		return out
	case "windows":
		if appData := os.Getenv("APPDATA"); appData != "" {
			return []string{filepath.Join(appData, "BeeperTexts")}
		}
		return []string{filepath.Join(home, "BeeperTexts")}
	default:
		configHome := os.Getenv("XDG_CONFIG_HOME")
		if configHome == "" {
			configHome = filepath.Join(home, ".config")
		}
		return []string{filepath.Join(configHome, "BeeperTexts")}
	}
}

func saveTargetAuth(t target, auth *storedAuth) error {
	if t.ID == customTargetID || t.ID == builtInDesktopTarget {
		cfg, err := readConfig()
		if err != nil {
			return err
		}
		cfg.Auth = auth
		cfg.BaseURL = t.BaseURL
		if cfg.DefaultTarget == "" {
			cfg.DefaultTarget = t.ID
		}
		return writeConfig(cfg)
	}
	t.Auth = auth
	return writeTarget(t)
}

func setupResult(t target, authSource string) map[string]any {
	return map[string]any{
		"target":     publicTarget(t),
		"authSource": authSource,
		"readiness":  liveTargetStatus(t),
	}
}

func publicTarget(t target) map[string]any {
	return map[string]any{
		"id":      t.ID,
		"type":    t.Type,
		"name":    t.Name,
		"baseURL": t.BaseURL,
		"managed": t.Managed,
		"dataDir": t.DataDir,
		"profile": t.Profile,
		"runtime": t.Runtime,
		"port":    t.Port,
	}
}

func firstString(values []string) string {
	if len(values) == 0 {
		return ""
	}
	return values[0]
}

func stringAny(value any) string {
	if s, ok := value.(string); ok {
		return s
	}
	return ""
}

func boolAny(value any) bool {
	b, _ := value.(bool)
	return b
}

func dedupeStrings(values []string) []string {
	seen := map[string]bool{}
	out := []string{}
	for _, value := range values {
		if value == "" || seen[value] {
			continue
		}
		seen[value] = true
		out = append(out, value)
	}
	return out
}
