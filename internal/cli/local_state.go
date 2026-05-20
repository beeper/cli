package cli

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	beeperdesktopapi "github.com/beeper/desktop-api-go/v5"
	"github.com/beeper/desktop-api-go/v5/option"
)

const (
	defaultDesktopPort   = 23373
	builtInDesktopTarget = "desktop"
	customTargetID       = "custom"
)

type storedAuth struct {
	AccessToken string `json:"accessToken"`
	ClientID    string `json:"clientID,omitempty"`
	ExpiresAt   string `json:"expiresAt,omitempty"`
	Scope       string `json:"scope,omitempty"`
	Source      string `json:"source,omitempty"`
	TokenType   string `json:"tokenType"`
}

type cliConfig struct {
	DefaultTarget  string      `json:"defaultTarget,omitempty"`
	DefaultAccount string      `json:"defaultAccount,omitempty"`
	BaseURL        string      `json:"baseURL,omitempty"`
	Auth           *storedAuth `json:"auth,omitempty"`
}

type target struct {
	ID        string         `json:"id"`
	Type      string         `json:"type"`
	Name      string         `json:"name,omitempty"`
	BaseURL   string         `json:"baseURL"`
	Auth      *storedAuth    `json:"auth,omitempty"`
	Managed   bool           `json:"managed,omitempty"`
	DataDir   string         `json:"dataDir,omitempty"`
	Profile   string         `json:"profile,omitempty"`
	Runtime   map[string]any `json:"runtime,omitempty"`
	ServerEnv string         `json:"serverEnv,omitempty"`
	Port      int            `json:"port,omitempty"`
}

type targetStatus struct {
	Reachable  bool   `json:"reachable"`
	Version    string `json:"version,omitempty"`
	BundleID   string `json:"bundleID,omitempty"`
	ActualType string `json:"actualType,omitempty"`
	Error      string `json:"error,omitempty"`
}

func beeperDir() string {
	if value := os.Getenv("BEEPER_CLI_CONFIG_DIR"); value != "" {
		return value
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return ".beeper"
	}
	return filepath.Join(home, ".beeper")
}

func configPath() string {
	return filepath.Join(beeperDir(), "config.json")
}

func targetsDir() string {
	return filepath.Join(beeperDir(), "targets")
}

func profileDataDir(kind string, id string) string {
	return filepath.Join(beeperDir(), "profiles", kind, id)
}

func targetPath(id string) string {
	return filepath.Join(targetsDir(), id+".json")
}

func readConfig() (cliConfig, error) {
	var cfg cliConfig
	data, err := os.ReadFile(configPath())
	if errors.Is(err, os.ErrNotExist) {
		return cfg, nil
	}
	if err != nil {
		return cfg, err
	}
	return cfg, json.Unmarshal(data, &cfg)
}

func writeConfig(cfg cliConfig) error {
	if err := os.MkdirAll(filepath.Dir(configPath()), 0o700); err != nil {
		return err
	}
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}
	data = append(data, '\n')
	return os.WriteFile(configPath(), data, 0o600)
}

func readTarget(id string) (*target, error) {
	data, err := os.ReadFile(targetPath(id))
	if errors.Is(err, os.ErrNotExist) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	var target target
	if err := json.Unmarshal(data, &target); err != nil {
		return nil, err
	}
	normalizeTarget(&target)
	return &target, nil
}

func writeTarget(t target) error {
	if err := os.MkdirAll(targetsDir(), 0o700); err != nil {
		return err
	}
	data, err := json.MarshalIndent(t, "", "  ")
	if err != nil {
		return err
	}
	data = append(data, '\n')
	return os.WriteFile(targetPath(t.ID), data, 0o600)
}

func removeTarget(id string) error {
	if err := os.Remove(targetPath(id)); err != nil && !errors.Is(err, os.ErrNotExist) {
		return err
	}
	cfg, err := readConfig()
	if err != nil {
		return err
	}
	if cfg.DefaultTarget == id {
		cfg.DefaultTarget = ""
	}
	if id == builtInDesktopTarget {
		cfg.Auth = nil
		cfg.BaseURL = ""
	}
	return writeConfig(cfg)
}

func listTargets() ([]target, error) {
	if err := os.MkdirAll(targetsDir(), 0o700); err != nil {
		return nil, err
	}
	entries, err := os.ReadDir(targetsDir())
	if err != nil {
		return nil, err
	}
	targets := []target{}
	for _, entry := range entries {
		if entry.IsDir() || filepath.Ext(entry.Name()) != ".json" {
			continue
		}
		data, err := os.ReadFile(filepath.Join(targetsDir(), entry.Name()))
		if err != nil {
			continue
		}
		var target target
		if json.Unmarshal(data, &target) == nil && target.ID != "" {
			normalizeTarget(&target)
			targets = append(targets, target)
		}
	}
	sort.Slice(targets, func(i, j int) bool { return targets[i].ID < targets[j].ID })
	return targets, nil
}

func resolveTarget(opts *globalOptions) (*target, error) {
	if opts.BaseURL != "" {
		return &target{ID: customTargetID, Type: "desktop", BaseURL: opts.BaseURL}, nil
	}
	cfg, err := readConfig()
	if err != nil {
		return nil, err
	}
	targetID := opts.Target
	if targetID == "" {
		targetID = os.Getenv("BEEPER_TARGET")
	}
	if targetID == "" {
		targetID = cfg.DefaultTarget
	}
	if targetID != "" {
		t, err := readTarget(targetID)
		if err != nil {
			return nil, err
		}
		if t == nil && targetID == builtInDesktopTarget {
			return builtInTarget(cfg), nil
		}
		if t == nil {
			return nil, usageError("unknown Beeper target %q. Run `beeper targets list`.", targetID)
		}
		applyConfigAuth(t, cfg)
		return t, nil
	}
	targets, err := listTargets()
	if err != nil {
		return nil, err
	}
	if len(targets) == 1 {
		applyConfigAuth(&targets[0], cfg)
		return &targets[0], nil
	}
	if t, err := readTarget(builtInDesktopTarget); err != nil {
		return nil, err
	} else if t != nil {
		applyConfigAuth(t, cfg)
		return t, nil
	}
	return builtInTarget(cfg), nil
}

func builtInTarget(cfg cliConfig) *target {
	baseURL := os.Getenv("BEEPER_DESKTOP_BASE_URL")
	if baseURL == "" {
		baseURL = cfg.BaseURL
	}
	if baseURL == "" {
		baseURL = "http://127.0.0.1:23373"
	}
	return &target{ID: builtInDesktopTarget, Type: "desktop", Name: "Beeper Desktop", BaseURL: baseURL, Auth: cfg.Auth}
}

func applyConfigAuth(t *target, cfg cliConfig) {
	if t.Auth != nil || t.Type != "desktop" || cfg.Auth == nil {
		return
	}
	if cfg.BaseURL != "" && cfg.BaseURL != t.BaseURL {
		return
	}
	t.Auth = cfg.Auth
}

func normalizeTarget(t *target) {
	if !t.Managed || t.Type == "remote" || t.Port == 0 {
		return
	}
	t.BaseURL = "http://127.0.0.1:" + strconv.Itoa(t.Port)
}

func liveTargetStatus(t target) targetStatus {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	client := beeperdesktopapi.NewClient(option.WithBaseURL(t.BaseURL), option.WithAccessToken(""))
	info, err := client.Info.Get(ctx)
	if err != nil {
		return targetStatus{Reachable: false, Error: "Could not reach " + t.BaseURL}
	}
	actualType := ""
	if strings.Contains(info.App.BundleID, ".server") {
		actualType = "server"
	} else if strings.Contains(info.App.BundleID, ".desktop") {
		actualType = "desktop"
	}
	return targetStatus{Reachable: true, Version: info.App.Version, BundleID: info.App.BundleID, ActualType: actualType}
}

func createProfileTarget(kind string, id string, port int, serverEnv string) (target, error) {
	if serverEnv == "" {
		serverEnv = "production"
	}
	if port == 0 {
		next, err := nextPort()
		if err != nil {
			return target{}, err
		}
		port = next
	}
	dataDir := profileDataDir(kind, id)
	t := target{
		ID:        id,
		Type:      kind,
		Name:      id,
		BaseURL:   "http://127.0.0.1:" + strconv.Itoa(port),
		Managed:   true,
		DataDir:   dataDir,
		Profile:   id,
		ServerEnv: serverEnv,
		Port:      port,
		Runtime: map[string]any{
			"install": kind,
			"dataDir": dataDir,
			"port":    port,
		},
	}
	if err := os.MkdirAll(dataDir, 0o700); err != nil {
		return target{}, err
	}
	if err := writeTarget(t); err != nil {
		return target{}, err
	}
	return t, nil
}

func nextPort() (int, error) {
	targets, err := listTargets()
	if err != nil {
		return 0, err
	}
	used := map[int]bool{}
	for _, target := range targets {
		if target.Port != 0 {
			used[target.Port] = true
		}
	}
	for port := defaultDesktopPort + 1; port < defaultDesktopPort+200; port++ {
		if !used[port] {
			return port, nil
		}
	}
	return 0, usageError("no available default port for a new Beeper target")
}
