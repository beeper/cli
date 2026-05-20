package cli

import (
	"bufio"
	"encoding/json"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"

	beeperdesktopapi "github.com/beeper/desktop-api-go/v5"
	"github.com/spf13/cobra"
)

func runDoctorCommand(opts *globalOptions, cmd *cobra.Command, args []string) error {
	target, err := resolveTarget(opts)
	if err != nil {
		return err
	}
	targetStatus := liveTargetStatus(*target)
	readiness := evaluateReadiness(opts)
	ready := readiness.State == "ready"
	if err := printData(opts, map[string]any{"ok": ready, "checks": map[string]any{"target": targetStatus, "readiness": readiness}}); err != nil {
		return err
	}
	if !ready {
		return usageError("target is not ready")
	}
	return nil
}

type readiness struct {
	State   string                               `json:"state"`
	App     *beeperdesktopapi.AppSessionResponse `json:"app,omitempty"`
	Actions []string                             `json:"actions"`
	Message string                               `json:"message,omitempty"`
	Error   string                               `json:"error,omitempty"`
}

func evaluateReadiness(opts *globalOptions) readiness {
	client, ctx, cancel, err := newClient(opts)
	if err != nil {
		return readiness{State: "target-unreachable", Actions: actionsForReadiness("target-unreachable"), Message: err.Error(), Error: err.Error()}
	}
	defer cancel()
	app, err := client.App.Session(ctx)
	if err != nil {
		return readiness{State: "target-unreachable", Actions: actionsForReadiness("target-unreachable"), Message: err.Error(), Error: err.Error()}
	}
	state := normalizeReadinessState(app)
	return readiness{
		State:   state,
		App:     app,
		Actions: actionsForReadiness(state),
		Message: nextReadinessStep(state, opts.Target),
	}
}

func normalizeReadinessState(app *beeperdesktopapi.AppSessionResponse) string {
	if app == nil {
		return "error"
	}
	switch string(app.State) {
	case "no-target", "target-unreachable", "needs-login", "login-in-progress", "initializing", "needs-cross-signing-setup", "needs-verification", "verification-in-progress", "needs-recovery-key", "needs-secrets", "needs-first-sync", "ready", "error":
		return string(app.State)
	default:
		if app.Verification.State != "" && string(app.State) != "ready" {
			return "verification-in-progress"
		}
		return "error"
	}
}

func nextReadinessStep(state string, targetID string) string {
	target := ""
	if targetID != "" && targetID != builtInDesktopTarget {
		target = " -t " + targetID
	}
	switch state {
	case "ready":
		return ""
	case "needs-login":
		return "Run: beeper setup" + target
	case "needs-verification":
		return "Run: beeper verify" + target
	case "needs-secrets", "needs-recovery-key":
		return "Run: beeper verify recovery-key" + target
	case "needs-cross-signing-setup":
		return "Run: beeper verify reset-recovery-key" + target
	default:
		return "Waiting for app state: " + state
	}
}

func actionsForReadiness(state string) []string {
	switch state {
	case "no-target":
		return []string{"targets add desktop", "targets add remote"}
	case "target-unreachable":
		return []string{"targets status", "targets start", "doctor"}
	case "needs-login", "login-in-progress":
		return []string{"setup", "auth status"}
	case "needs-cross-signing-setup":
		return []string{"verify reset-recovery-key"}
	case "needs-verification", "verification-in-progress":
		return []string{"verify", "verify list", "verify sas", "verify qr-scan"}
	case "needs-recovery-key", "needs-secrets":
		return []string{"verify recovery-key"}
	case "needs-first-sync", "initializing":
		return []string{"setup", "status"}
	case "ready":
		return []string{"chats list", "messages list", "send text"}
	default:
		return []string{"doctor", "setup"}
	}
}

func runSetupCommand(opts *globalOptions, cmd *cobra.Command, args []string) error {
	localMode, _ := cmd.Flags().GetBool("local")
	oauthMode, _ := cmd.Flags().GetBool("oauth")
	serverMode, _ := cmd.Flags().GetBool("server")
	desktopMode, _ := cmd.Flags().GetBool("desktop")
	installMode, _ := cmd.Flags().GetBool("install")
	remote := firstFlag(cmd, "remote")
	email := firstFlag(cmd, "email")
	targetModeCount := boolCount(remote != "", serverMode, desktopMode)
	if targetModeCount > 1 {
		return usageError("Specify at most one of --remote, --server, or --desktop")
	}
	authModeCount := boolCount(localMode, oauthMode, email != "")
	if authModeCount > 1 {
		return usageError("Specify at most one of --local, --oauth, or --email")
	}
	if (localMode || oauthMode) && (remote != "" || serverMode || desktopMode) {
		return usageError("Use --local or --oauth with an existing target, not with --remote, --server, or --desktop.")
	}
	if opts.Events {
		writeEvent("setup_step", map[string]any{"step": "start", "target": opts.Target})
	}
	if remote != "" {
		name := opts.Target
		if name == "" {
			name = remoteName(remote)
		}
		target := target{ID: name, Name: name, Type: "remote", BaseURL: remote}
		if err := writeTarget(target); err != nil {
			return err
		}
		cfg, err := readConfig()
		if err != nil {
			return err
		}
		if cfg.DefaultTarget == "" {
			cfg.DefaultTarget = target.ID
			if err := writeConfig(cfg); err != nil {
				return err
			}
		}
		if email != "" {
			result, err := setupEmailTarget(opts, target, email, firstFlag(cmd, "username"))
			if err != nil {
				return err
			}
			return printData(opts, result)
		}
		if localMode {
			return usageError("Use --local with an existing local Desktop target, not with --remote.")
		}
		result, err := setupOAuthTarget(opts, target)
		if err != nil {
			return err
		}
		return printData(opts, result)
	}
	if serverMode || desktopMode {
		kind := "server"
		if desktopMode {
			kind = "desktop"
		}
		if installMode {
			if (opts.JSON || !stdinIsTTY()) && !opts.Yes {
				return usageError("Install requires --install --yes in non-interactive mode.")
			}
			channel := firstFlag(cmd, "channel")
			serverEnv := firstFlag(cmd, "server-env")
			if kind == "server" {
				if _, err := installServer(channel, serverEnv); err != nil {
					return err
				}
			} else if _, err := installDesktop(channel, serverEnv); err != nil {
				return err
			}
		}
		name := opts.Target
		if name == "" {
			name = kind
		}
		existing, err := readTarget(name)
		if err != nil {
			return err
		}
		var target target
		if existing != nil {
			target = *existing
		} else {
			port, _ := cmd.Flags().GetInt("port")
			target, err = createProfileTarget(kind, name, port, firstFlag(cmd, "server-env"))
			if err != nil {
				return err
			}
		}
		cfg, err := readConfig()
		if err != nil {
			return err
		}
		if cfg.DefaultTarget == "" {
			cfg.DefaultTarget = target.ID
			if err := writeConfig(cfg); err != nil {
				return err
			}
		}
		var run *profileRun
		if kind == "server" || opts.Yes {
			run, _ = startProfile(target)
		}
		if email != "" {
			result, err := setupEmailTarget(opts, target, email, firstFlag(cmd, "username"))
			if err != nil {
				return err
			}
			result["run"] = run
			return printData(opts, result)
		}
		return printData(opts, map[string]any{"target": target, "run": run, "readiness": liveTargetStatus(target)})
	}
	target, err := resolveTarget(opts)
	if err != nil {
		return err
	}
	if localMode {
		result, err := setupLocalDesktopTarget(*target)
		if err != nil {
			return err
		}
		return printData(opts, result)
	}
	if oauthMode {
		result, err := setupOAuthTarget(opts, *target)
		if err != nil {
			return err
		}
		return printData(opts, result)
	}
	if email != "" {
		result, err := setupEmailTarget(opts, *target, email, firstFlag(cmd, "username"))
		if err != nil {
			return err
		}
		return printData(opts, result)
	}
	return printData(opts, map[string]any{"target": target, "readiness": liveTargetStatus(*target)})
}

func boolCount(values ...bool) int {
	count := 0
	for _, value := range values {
		if value {
			count++
		}
	}
	return count
}

func runUpdateCommand(opts *globalOptions, cmd *cobra.Command, args []string) error {
	checkOnly, _ := cmd.Flags().GetBool("check")
	if !checkOnly {
		if err := ensureWritable(opts); err != nil {
			return err
		}
	}
	cliSelected, _ := cmd.Flags().GetBool("cli")
	desktopSelected, _ := cmd.Flags().GetBool("desktop")
	serverSelected, _ := cmd.Flags().GetBool("server")
	selected := cliSelected || desktopSelected || serverSelected
	installs, err := readInstallations()
	if err != nil {
		return err
	}
	results := []map[string]any{}
	if !selected || cliSelected {
		results = append(results, checkCLIUpdate(cmd.Root().Version))
	}
	if !selected || desktopSelected {
		if installs.Desktop == nil {
			results = append(results, map[string]any{"kind": "desktop", "installed": false, "action": "Run: beeper install desktop"})
		} else {
			check := checkInstallationUpdate(*installs.Desktop)
			results = append(results, map[string]any{
				"kind":           "desktop",
				"installed":      true,
				"currentVersion": check.CurrentVersion,
				"latestVersion":  check.LatestVersion,
				"available":      check.Available,
				"action":         check.Action,
				"feedURL":        check.FeedURL,
				"error":          check.Error,
			})
		}
	}
	if !selected || serverSelected {
		result, err := updateServerResult(installs.Server, checkOnly)
		if err != nil {
			return err
		}
		results = append(results, result)
	}
	return printData(opts, results)
}

func checkCLIUpdate(currentVersion string) map[string]any {
	result := map[string]any{
		"kind":           "cli",
		"currentVersion": currentVersion,
		"installMethod":  "unknown",
		"available":      false,
	}
	req, err := http.NewRequest(http.MethodGet, "https://api.github.com/repos/beeper/cli/releases/latest", nil)
	if err == nil {
		req.Header.Set("accept", "application/vnd.github+json")
		req.Header.Set("user-agent", "beeper-cli")
		client := &http.Client{}
		if res, err := client.Do(req); err == nil {
			defer res.Body.Close()
			var payload struct {
				TagName string `json:"tag_name"`
			}
			if json.NewDecoder(res.Body).Decode(&payload) == nil && payload.TagName != "" {
				latest := strings.TrimPrefix(payload.TagName, "v")
				result["latestVersion"] = latest
				result["available"] = latest != currentVersion
			}
		} else {
			result["error"] = err.Error()
		}
	}
	if result["available"] == true {
		result["action"] = "Install the latest Go release artifact for your platform."
	} else {
		result["action"] = "Beeper CLI is up to date or no newer release was found."
	}
	return result
}

func updateServerResult(inst *installation, checkOnly bool) (map[string]any, error) {
	if inst == nil {
		return map[string]any{"kind": "server", "installed": false, "action": "Run: beeper install server"}, nil
	}
	check := checkInstallationUpdate(*inst)
	if !check.Available || checkOnly {
		return map[string]any{
			"kind":           "server",
			"installed":      true,
			"currentVersion": check.CurrentVersion,
			"latestVersion":  check.LatestVersion,
			"available":      check.Available,
			"action":         check.Action,
			"feedURL":        check.FeedURL,
			"error":          check.Error,
		}, nil
	}
	runningProfiles, err := runningServerProfiles()
	if err != nil {
		return nil, err
	}
	updated, err := updateServerInstallation(*inst)
	if err != nil {
		return nil, err
	}
	restarted := []string{}
	for _, profile := range runningProfiles {
		_ = stopProfile(profile)
		if _, err := startProfile(profile); err != nil {
			return nil, err
		}
		restarted = append(restarted, profile.ID)
	}
	return map[string]any{
		"kind":              "server",
		"updated":           true,
		"previousVersion":   inst.Version,
		"currentVersion":    updated.Version,
		"path":              updated.Path,
		"restartedProfiles": restarted,
		"hint":              pathSetupHint(),
	}, nil
}

func runningServerProfiles() ([]target, error) {
	targets, err := listTargets()
	if err != nil {
		return nil, err
	}
	running := []target{}
	for _, target := range targets {
		if !target.Managed || target.Type != "server" {
			continue
		}
		status, err := profileStatus(target)
		if err != nil {
			return nil, err
		}
		if value, _ := status["running"].(bool); value {
			running = append(running, target)
		}
	}
	return running, nil
}

func pathSetupHint() string {
	pathValue := os.Getenv("PATH")
	for _, dir := range filepath.SplitList(pathValue) {
		if dir == binDir() {
			return ""
		}
	}
	return "Add " + binDir() + ` to PATH.`
}

type rpcRequest struct {
	Args    []string        `json:"args"`
	Argv    []string        `json:"argv"`
	Command string          `json:"command"`
	ID      json.RawMessage `json:"id"`
}

func runRPCCommand(opts *globalOptions, cmd *cobra.Command, args []string) error {
	scanner := bufio.NewScanner(os.Stdin)
	for scanner.Scan() {
		line := scanner.Bytes()
		if len(line) == 0 {
			continue
		}
		var req rpcRequest
		requestID := json.RawMessage("null")
		result := map[string]any{}
		if err := json.Unmarshal(line, &req); err != nil {
			result = map[string]any{"id": requestID, "ok": false, "error": err.Error()}
		} else {
			if len(req.ID) > 0 {
				requestID = req.ID
			}
			argv := req.Args
			if len(argv) == 0 {
				argv = req.Argv
			}
			if len(argv) == 0 && req.Command != "" {
				argv = splitCommandLine(req.Command)
			}
			if len(argv) == 0 || argv[0] == "rpc" {
				result = map[string]any{"id": requestID, "ok": false, "error": "Expected args, argv, or command"}
			} else {
				exe, _ := os.Executable()
				child := exec.Command(exe, argv...)
				stdout, err := child.Output()
				code := 0
				stderr := ""
				if err != nil {
					code = 1
					if exit, ok := err.(*exec.ExitError); ok {
						code = exit.ExitCode()
						stderr = string(exit.Stderr)
					} else {
						stderr = err.Error()
					}
				}
				result = map[string]any{"id": requestID, "ok": code == 0, "code": code, "stdout": string(stdout), "stderr": stderr}
			}
		}
		encoded, _ := json.Marshal(result)
		cmd.OutOrStdout().Write(encoded)
		cmd.OutOrStdout().Write([]byte("\n"))
	}
	return scanner.Err()
}

func splitCommandLine(input string) []string {
	out := []string{}
	current := ""
	quote := rune(0)
	escaped := false
	for _, r := range input {
		if escaped {
			current += string(r)
			escaped = false
			continue
		}
		if r == '\\' {
			escaped = true
			continue
		}
		if quote != 0 {
			if r == quote {
				quote = 0
			} else {
				current += string(r)
			}
			continue
		}
		if r == '\'' || r == '"' {
			quote = r
			continue
		}
		if r == ' ' || r == '\t' || r == '\n' {
			if current != "" {
				out = append(out, current)
				current = ""
			}
			continue
		}
		current += string(r)
	}
	if current != "" {
		out = append(out, current)
	}
	return out
}

func remoteName(rawURL string) string {
	parsed, err := url.Parse(rawURL)
	if err != nil || parsed.Hostname() == "" {
		return "remote"
	}
	name := regexp.MustCompile(`[^a-zA-Z0-9._-]+`).ReplaceAllString(parsed.Hostname(), "-")
	if name == "" {
		return "remote"
	}
	return name
}
