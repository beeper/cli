package cli

import (
	"archive/tar"
	"archive/zip"
	"compress/gzip"
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"time"
)

type installation struct {
	Kind        string `json:"kind"`
	Channel     string `json:"channel"`
	ServerEnv   string `json:"serverEnv"`
	BundleID    string `json:"bundleID"`
	Version     string `json:"version,omitempty"`
	Path        string `json:"path"`
	FeedURL     string `json:"feedURL"`
	DownloadURL string `json:"downloadURL"`
	InstalledAt string `json:"installedAt"`
	UpdatedAt   string `json:"updatedAt"`
}

type installations struct {
	Desktop *installation `json:"desktop,omitempty"`
	Server  *installation `json:"server,omitempty"`
}

type profileRun struct {
	ID        string `json:"id"`
	PID       int    `json:"pid"`
	StartedAt string `json:"startedAt"`
	Log       string `json:"log"`
	ErrorLog  string `json:"errorLog"`
}

func installationsPath() string { return filepath.Join(beeperDir(), "installations.json") }
func appsDir() string           { return filepath.Join(beeperDir(), "apps") }
func binDir() string            { return filepath.Join(beeperDir(), "bin") }
func desktopInstallDir() string { return filepath.Join(appsDir(), "desktop") }
func serverBinPath() string     { return filepath.Join(binDir(), "beeper-server") }
func profileRunDir() string     { return filepath.Join(beeperDir(), "run", "profiles") }
func profileLogDir() string     { return filepath.Join(beeperDir(), "logs", "profiles") }
func profileRunPath(id string) string {
	return filepath.Join(profileRunDir(), id+".json")
}
func profileLogPath(id string) string {
	return filepath.Join(profileLogDir(), id+".log")
}
func profileErrorLogPath(id string) string {
	return filepath.Join(profileLogDir(), id+".err.log")
}

func readInstallations() (installations, error) {
	var out installations
	data, err := os.ReadFile(installationsPath())
	if os.IsNotExist(err) {
		return out, nil
	}
	if err != nil {
		return out, err
	}
	return out, json.Unmarshal(data, &out)
}

func writeInstallations(value installations) error {
	if err := os.MkdirAll(filepath.Dir(installationsPath()), 0o700); err != nil {
		return err
	}
	data, err := json.MarshalIndent(value, "", "  ")
	if err != nil {
		return err
	}
	data = append(data, '\n')
	return os.WriteFile(installationsPath(), data, 0o600)
}

func installServer(channel string, serverEnv string) (*installation, error) {
	if runtime.GOOS == "windows" {
		return nil, usageError("Beeper Server install is not available on Windows")
	}
	req, err := normalizedInstallRequest("server", channel, serverEnv)
	if err != nil {
		return nil, err
	}
	feedURL := feedURLFor(req)
	version := "unknown"
	if feed, err := fetchFeed(feedURL); err == nil && feed.Version != "" {
		version = feed.Version
	}
	downloadURL := downloadURLFor(req)
	stageDir := filepath.Join(appsDir(), "server", req.Channel+"-"+version+"-"+strconv.FormatInt(time.Now().UnixMilli(), 10))
	if err := os.MkdirAll(stageDir, 0o700); err != nil {
		return nil, err
	}
	artifact, err := downloadArtifact(downloadURL, stageDir)
	if err != nil {
		return nil, err
	}
	executable, err := extractServerArtifact(artifact, stageDir)
	if err != nil {
		return nil, err
	}
	if err := os.MkdirAll(binDir(), 0o700); err != nil {
		return nil, err
	}
	_ = os.Remove(serverBinPath())
	if err := os.Symlink(executable, serverBinPath()); err != nil {
		return nil, err
	}
	now := time.Now().UTC().Format(time.RFC3339)
	inst := &installation{Kind: "server", Channel: req.Channel, ServerEnv: req.ServerEnv, BundleID: req.BundleID, Version: version, Path: serverBinPath(), FeedURL: feedURL, DownloadURL: downloadURL, InstalledAt: now, UpdatedAt: now}
	current, err := readInstallations()
	if err != nil {
		return nil, err
	}
	current.Server = inst
	return inst, writeInstallations(current)
}

func installDesktop(channel string, serverEnv string) (*installation, error) {
	req, err := normalizedInstallRequest("desktop", channel, serverEnv)
	if err != nil {
		return nil, err
	}
	feedURL := feedURLFor(req)
	feed, err := fetchFeed(feedURL)
	if err != nil {
		return nil, err
	}
	if feed.URL == "" {
		return nil, usageError("Desktop update feed did not include a download URL")
	}
	stageDir := filepath.Join(appsDir(), "desktop-"+req.Channel+"-"+strconv.FormatInt(time.Now().UnixMilli(), 10))
	if err := os.MkdirAll(stageDir, 0o700); err != nil {
		return nil, err
	}
	artifact, err := downloadArtifact(feed.URL, stageDir)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC().Format(time.RFC3339)
	_ = os.RemoveAll(desktopInstallDir())
	if err := os.MkdirAll(desktopInstallDir(), 0o700); err != nil {
		return nil, err
	}
	appPath, err := extractDesktopArtifact(artifact, desktopInstallDir())
	if err != nil {
		return nil, err
	}
	_ = os.RemoveAll(stageDir)
	inst := &installation{Kind: "desktop", Channel: req.Channel, ServerEnv: req.ServerEnv, BundleID: req.BundleID, Version: feed.Version, Path: appPath, FeedURL: feedURL, DownloadURL: feed.URL, InstalledAt: now, UpdatedAt: now}
	current, err := readInstallations()
	if err != nil {
		return nil, err
	}
	current.Desktop = inst
	return inst, writeInstallations(current)
}

type installRequest struct {
	Kind         string
	Channel      string
	ServerEnv    string
	Platform     string
	FeedPlatform string
	Arch         string
	BundleID     string
	APIBaseURL   string
}

func normalizedInstallRequest(kind, channel, serverEnv string) (installRequest, error) {
	if channel == "" {
		channel = "stable"
	}
	if serverEnv == "" {
		serverEnv = "production"
	}
	if kind == "server" {
		serverEnv = "staging"
	}
	if serverEnv == "staging" {
		channel = "nightly"
	}
	platform := runtime.GOOS
	downloadPlatform := platform
	if platform == "darwin" {
		downloadPlatform = "macos"
	}
	arch := runtime.GOARCH
	if arch == "amd64" {
		arch = "x64"
	}
	if arch != "x64" && arch != "arm64" {
		return installRequest{}, usageError("unsupported architecture %q", runtime.GOARCH)
	}
	base := "com.automattic.beeper.desktop"
	if kind == "server" {
		base = "com.automattic.beeper.server"
	}
	bundleID := base
	if channel == "nightly" {
		bundleID += ".nightly"
	}
	apiBaseURL := "https://api.beeper.com"
	if kind == "server" || serverEnv == "staging" {
		apiBaseURL = "https://api.beeper-staging.com"
	}
	return installRequest{Kind: kind, Channel: channel, ServerEnv: serverEnv, Platform: downloadPlatform, FeedPlatform: platform, Arch: arch, BundleID: bundleID, APIBaseURL: apiBaseURL}, nil
}

type feedInfo struct {
	Version string
	URL     string
}

type installationUpdateInfo struct {
	Available      bool   `json:"available"`
	LatestVersion  string `json:"latestVersion,omitempty"`
	CurrentVersion string `json:"currentVersion,omitempty"`
	Action         string `json:"action"`
	FeedURL        string `json:"feedURL,omitempty"`
	Error          string `json:"error,omitempty"`
}

func feedURLFor(req installRequest) string {
	return req.APIBaseURL + "/desktop/update-feed.json?bundleID=" + req.BundleID + "&platform=" + req.FeedPlatform + "&channel=" + req.Channel + "&arch=" + req.Arch
}

func downloadURLFor(req installRequest) string {
	channelSegment := req.Channel
	if req.Kind == "server" && req.ServerEnv == "staging" {
		channelSegment = "stable"
	}
	return req.APIBaseURL + "/desktop/download/" + req.Platform + "/" + req.Arch + "/" + channelSegment + "/" + req.BundleID
}

func fetchFeed(url string) (feedInfo, error) {
	client := &http.Client{Timeout: 30 * time.Second}
	res, err := client.Get(url)
	if err != nil {
		return feedInfo{}, err
	}
	defer res.Body.Close()
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return feedInfo{}, usageError("update feed returned %s", res.Status)
	}
	var raw map[string]any
	if err := json.NewDecoder(res.Body).Decode(&raw); err != nil {
		return feedInfo{}, err
	}
	return feedInfo{Version: stringField(raw, "version", "name"), URL: stringField(raw, "url", "downloadURL", "downloadUrl")}, nil
}

func stringField(raw map[string]any, fields ...string) string {
	for _, field := range fields {
		if value, ok := raw[field].(string); ok && value != "" {
			return value
		}
	}
	return ""
}

func checkInstallationUpdate(inst installation) installationUpdateInfo {
	info := installationUpdateInfo{
		CurrentVersion: inst.Version,
		FeedURL:        inst.FeedURL,
	}
	feed, err := fetchFeed(inst.FeedURL)
	if err != nil {
		info.Available = false
		info.Error = err.Error()
		info.Action = "Could not check update feed: " + err.Error()
		return info
	}
	info.LatestVersion = feed.Version
	info.Available = feed.Version != "" && feed.Version != inst.Version
	switch inst.Kind {
	case "desktop":
		info.Action = "Update Beeper Desktop in the app."
	case "server":
		if info.Available {
			info.Action = "Run: beeper update --server"
		} else {
			info.Action = "Beeper Server is up to date."
		}
	default:
		if info.Available {
			info.Action = "Update is available."
		} else {
			info.Action = "Installed app is up to date."
		}
	}
	return info
}

func updateServerInstallation(inst installation) (*installation, error) {
	return installServer(inst.Channel, inst.ServerEnv)
}

func downloadArtifact(rawURL, dir string) (string, error) {
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return "", err
	}
	client := &http.Client{Timeout: 120 * time.Second}
	res, err := client.Get(rawURL)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return "", usageError("download returned %s", res.Status)
	}
	name := filepath.Base(res.Request.URL.Path)
	if name == "." || name == "/" || name == "" {
		name = "beeper-download-" + strconv.FormatInt(time.Now().UnixMilli(), 10)
	}
	path := filepath.Join(dir, name)
	file, err := os.Create(path)
	if err != nil {
		return "", err
	}
	_, copyErr := io.Copy(file, res.Body)
	closeErr := file.Close()
	if copyErr != nil {
		return "", copyErr
	}
	return path, closeErr
}

func extractServerArtifact(artifactPath, dir string) (string, error) {
	extractDir := filepath.Join(dir, "extract")
	_ = os.RemoveAll(extractDir)
	if err := os.MkdirAll(extractDir, 0o700); err != nil {
		return "", err
	}
	switch {
	case strings.HasSuffix(artifactPath, ".tar.gz") || strings.HasSuffix(artifactPath, ".tgz"):
		if err := untarGz(artifactPath, extractDir); err != nil {
			return "", err
		}
	case strings.HasSuffix(artifactPath, ".zip"):
		if err := unzip(artifactPath, extractDir); err != nil {
			return "", err
		}
	default:
		final := filepath.Join(dir, "beeper-server")
		if err := os.Rename(artifactPath, final); err != nil {
			return "", err
		}
		return final, os.Chmod(final, 0o755)
	}
	exe, err := findServerExecutable(extractDir)
	if err != nil {
		return "", err
	}
	final := filepath.Join(dir, "beeper-server")
	if err := os.Rename(exe, final); err != nil {
		return "", err
	}
	return final, os.Chmod(final, 0o755)
}

func extractDesktopArtifact(artifactPath, dir string) (string, error) {
	switch {
	case strings.HasSuffix(artifactPath, ".dmg"):
		if runtime.GOOS != "darwin" {
			return artifactPath, nil
		}
		mountPoint, err := attachDMG(artifactPath)
		if err != nil {
			return "", err
		}
		defer exec.Command("/usr/bin/hdiutil", "detach", mountPoint, "-quiet").Run()
		app, err := findAppBundle(mountPoint)
		if err != nil {
			return "", err
		}
		final := filepath.Join(dir, filepath.Base(app))
		return final, copyPath(app, final)
	case strings.HasSuffix(artifactPath, ".zip"):
		extractDir := filepath.Join(dir, "extract")
		_ = os.RemoveAll(extractDir)
		if err := os.MkdirAll(extractDir, 0o700); err != nil {
			return "", err
		}
		if err := unzip(artifactPath, extractDir); err != nil {
			return "", err
		}
		app, err := findAppBundle(extractDir)
		if err != nil {
			return "", err
		}
		final := filepath.Join(dir, filepath.Base(app))
		if err := copyPath(app, final); err != nil {
			return "", err
		}
		_ = os.RemoveAll(extractDir)
		return final, nil
	default:
		return artifactPath, nil
	}
}

func attachDMG(artifactPath string) (string, error) {
	out, err := exec.Command("/usr/bin/hdiutil", "attach", "-nobrowse", "-readonly", artifactPath).Output()
	if err != nil {
		return "", err
	}
	lines := strings.Split(string(out), "\n")
	for _, line := range lines {
		if index := strings.Index(line, "/Volumes/"); index >= 0 {
			return strings.TrimSpace(line[index:]), nil
		}
	}
	return "", usageError("could not find mounted volume for %s", artifactPath)
}

func findAppBundle(dir string) (string, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return "", err
	}
	for _, entry := range entries {
		path := filepath.Join(dir, entry.Name())
		if !entry.IsDir() {
			continue
		}
		if strings.HasSuffix(entry.Name(), ".app") {
			return path, nil
		}
		if found, err := findAppBundle(path); err == nil && found != "" {
			return found, nil
		}
	}
	return "", usageError("downloaded Beeper Desktop artifact did not contain an app bundle")
}

func copyPath(source, destination string) error {
	_ = os.RemoveAll(destination)
	info, err := os.Stat(source)
	if err != nil {
		return err
	}
	if !info.IsDir() {
		return copyFile(source, destination, info.Mode())
	}
	if err := os.MkdirAll(destination, info.Mode()); err != nil {
		return err
	}
	return filepath.WalkDir(source, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if path == source {
			return nil
		}
		rel, err := filepath.Rel(source, path)
		if err != nil {
			return err
		}
		target := filepath.Join(destination, rel)
		info, err := d.Info()
		if err != nil {
			return err
		}
		if d.IsDir() {
			return os.MkdirAll(target, info.Mode())
		}
		return copyFile(path, target, info.Mode())
	})
}

func copyFile(source, destination string, mode os.FileMode) error {
	if err := os.MkdirAll(filepath.Dir(destination), 0o700); err != nil {
		return err
	}
	src, err := os.Open(source)
	if err != nil {
		return err
	}
	defer src.Close()
	dst, err := os.OpenFile(destination, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, mode)
	if err != nil {
		return err
	}
	_, copyErr := io.Copy(dst, src)
	closeErr := dst.Close()
	if copyErr != nil {
		return copyErr
	}
	return closeErr
}

func untarGz(path, dir string) error {
	file, err := os.Open(path)
	if err != nil {
		return err
	}
	defer file.Close()
	gz, err := gzip.NewReader(file)
	if err != nil {
		return err
	}
	defer gz.Close()
	tr := tar.NewReader(gz)
	for {
		header, err := tr.Next()
		if err == io.EOF {
			return nil
		}
		if err != nil {
			return err
		}
		out := filepath.Join(dir, filepath.Clean(header.Name))
		if !strings.HasPrefix(out, dir) {
			return usageError("archive path escapes destination: %s", header.Name)
		}
		if header.FileInfo().IsDir() {
			if err := os.MkdirAll(out, header.FileInfo().Mode()); err != nil {
				return err
			}
			continue
		}
		if err := os.MkdirAll(filepath.Dir(out), 0o700); err != nil {
			return err
		}
		dst, err := os.OpenFile(out, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, header.FileInfo().Mode())
		if err != nil {
			return err
		}
		_, copyErr := io.Copy(dst, tr)
		closeErr := dst.Close()
		if copyErr != nil {
			return copyErr
		}
		if closeErr != nil {
			return closeErr
		}
	}
}

func unzip(path, dir string) error {
	reader, err := zip.OpenReader(path)
	if err != nil {
		return err
	}
	defer reader.Close()
	for _, file := range reader.File {
		out := filepath.Join(dir, filepath.Clean(file.Name))
		if !strings.HasPrefix(out, dir) {
			return usageError("archive path escapes destination: %s", file.Name)
		}
		if file.FileInfo().IsDir() {
			if err := os.MkdirAll(out, file.Mode()); err != nil {
				return err
			}
			continue
		}
		if err := os.MkdirAll(filepath.Dir(out), 0o700); err != nil {
			return err
		}
		src, err := file.Open()
		if err != nil {
			return err
		}
		dst, err := os.OpenFile(out, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, file.Mode())
		if err != nil {
			src.Close()
			return err
		}
		_, copyErr := io.Copy(dst, src)
		closeSrcErr := src.Close()
		closeDstErr := dst.Close()
		if copyErr != nil {
			return copyErr
		}
		if closeSrcErr != nil {
			return closeSrcErr
		}
		if closeDstErr != nil {
			return closeDstErr
		}
	}
	return nil
}

func findServerExecutable(dir string) (string, error) {
	var found string
	err := filepath.WalkDir(dir, func(path string, d os.DirEntry, err error) error {
		if err != nil || d.IsDir() || found != "" {
			return err
		}
		name := d.Name()
		if name == "beeper-server" || name == "beeper-server.exe" {
			found = path
		}
		return nil
	})
	if err != nil {
		return "", err
	}
	if found == "" {
		return "", usageError("downloaded Beeper Server artifact did not contain a beeper-server executable")
	}
	return found, nil
}

func readRun(id string) (*profileRun, error) {
	var run profileRun
	data, err := os.ReadFile(profileRunPath(id))
	if os.IsNotExist(err) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &run, json.Unmarshal(data, &run)
}

func startProfile(t target) (*profileRun, error) {
	if !t.Managed || t.DataDir == "" {
		return nil, usageError("target %q is not a local profile", t.ID)
	}
	if t.Type == "desktop" {
		return launchDesktopApp(&t)
	}
	current, err := readRun(t.ID)
	if err != nil {
		return nil, err
	}
	if current != nil && isRunning(current.PID) {
		return current, nil
	}
	installs, err := readInstallations()
	if err != nil {
		return nil, err
	}
	binary := os.Getenv("BEEPER_SERVER_BIN")
	if binary == "" && installs.Server != nil {
		binary = installs.Server.Path
	}
	if binary == "" {
		return nil, usageError("Beeper Server is not installed. Run: beeper install server")
	}
	if err := os.MkdirAll(profileRunDir(), 0o700); err != nil {
		return nil, err
	}
	if err := os.MkdirAll(profileLogDir(), 0o700); err != nil {
		return nil, err
	}
	logPath := profileLogPath(t.ID)
	errPath := profileErrorLogPath(t.ID)
	stdout, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o600)
	if err != nil {
		return nil, err
	}
	defer stdout.Close()
	stderr, err := os.OpenFile(errPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o600)
	if err != nil {
		return nil, err
	}
	defer stderr.Close()
	cmd := exec.Command(binary, serverArgs(t)...)
	cmd.Env = append(os.Environ(), "BEEPER_SERVER_DATA_DIR="+t.DataDir)
	cmd.Stdout = stdout
	cmd.Stderr = stderr
	setDetachedProcess(cmd)
	if err := cmd.Start(); err != nil {
		return nil, err
	}
	run := &profileRun{ID: t.ID, PID: cmd.Process.Pid, StartedAt: time.Now().UTC().Format(time.RFC3339), Log: logPath, ErrorLog: errPath}
	data, _ := json.MarshalIndent(run, "", "  ")
	data = append(data, '\n')
	return run, os.WriteFile(profileRunPath(t.ID), data, 0o600)
}

func launchDesktopApp(t *target) (*profileRun, error) {
	appPath, err := findDesktopAppPath()
	if err != nil {
		return nil, err
	}
	args := []string{"--no-enforce-app-location"}
	if t != nil && t.Port != 0 {
		args = append(args, "--pas-port="+strconv.Itoa(t.Port))
	}
	if t != nil && t.ServerEnv != "" {
		args = append(args, "--server-env="+t.ServerEnv)
	}
	env := os.Environ()
	id := builtInDesktopTarget
	if t != nil {
		id = t.ID
		if t.DataDir != "" {
			env = append(env,
				"ALLOW_MULTIPLE_INSTANCES=true",
				"BEEPER_PROFILE="+firstNonEmpty(t.Profile, t.ID),
				"BEEPER_USER_DATA_DIR="+t.DataDir,
			)
		}
	}
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "darwin":
		openArgs := []string{"-n"}
		if appPath != "" {
			openArgs = append(openArgs, appPath)
		} else {
			openArgs = append(openArgs, "-a", "Beeper")
		}
		openArgs = append(openArgs, "--args")
		openArgs = append(openArgs, args...)
		cmd = exec.Command("open", openArgs...)
	case "windows", "linux":
		if appPath == "" {
			return nil, usageError("Beeper Desktop app was not found")
		}
		cmd = exec.Command(appPath, args...)
	default:
		return nil, usageError("starting managed Desktop profiles is not available on %s", runtime.GOOS)
	}
	cmd.Env = env
	setDetachedProcess(cmd)
	if err := cmd.Start(); err != nil {
		return nil, err
	}
	return &profileRun{ID: id, PID: cmd.Process.Pid, StartedAt: time.Now().UTC().Format(time.RFC3339)}, nil
}

func findDesktopAppPath() (string, error) {
	installs, err := readInstallations()
	if err != nil {
		return "", err
	}
	if installs.Desktop != nil && installs.Desktop.Path != "" && pathExists(installs.Desktop.Path) {
		return installs.Desktop.Path, nil
	}
	switch runtime.GOOS {
	case "darwin":
		for _, path := range []string{"/Applications/Beeper.app", "/Applications/Beeper Nightly.app"} {
			if pathExists(path) {
				return path, nil
			}
		}
		return "", nil
	case "windows":
		localAppData := os.Getenv("LOCALAPPDATA")
		if localAppData == "" {
			if home, err := os.UserHomeDir(); err == nil {
				localAppData = filepath.Join(home, "AppData", "Local")
			}
		}
		for _, path := range []string{
			filepath.Join(localAppData, "Programs", "Beeper", "Beeper.exe"),
			filepath.Join(localAppData, "Programs", "Beeper Nightly", "Beeper Nightly.exe"),
		} {
			if pathExists(path) {
				return path, nil
			}
		}
	case "linux":
		for _, path := range []string{"/usr/bin/beeper", "/usr/local/bin/beeper"} {
			if pathExists(path) {
				return path, nil
			}
		}
	}
	return "", nil
}

func stopProfile(t target) error {
	run, err := readRun(t.ID)
	if err != nil {
		return err
	}
	if run == nil || !isRunning(run.PID) {
		_ = os.Remove(profileRunPath(t.ID))
		return usageError("profile %q is not running", t.ID)
	}
	if err := terminateProcessGroup(run.PID); err != nil {
		return err
	}
	time.Sleep(500 * time.Millisecond)
	_ = os.Remove(profileRunPath(t.ID))
	return nil
}

func pathExists(path string) bool {
	if path == "" {
		return false
	}
	_, err := os.Stat(path)
	return err == nil
}

func profileStatus(t target) (map[string]any, error) {
	run, err := readRun(t.ID)
	if err != nil {
		return nil, err
	}
	return map[string]any{
		"id":        t.ID,
		"type":      t.Type,
		"url":       t.BaseURL,
		"running":   run != nil && isRunning(run.PID),
		"pid":       pidOrNil(run),
		"startedAt": startedAtOrNil(run),
		"log":       profileLogPath(t.ID),
		"errorLog":  profileErrorLogPath(t.ID),
	}, nil
}

func enableProfile(t target) (string, error) {
	if !t.Managed || t.DataDir == "" || t.Type != "server" {
		return "", usageError("target %q is not a local Beeper Server install", t.ID)
	}
	switch runtime.GOOS {
	case "darwin":
		return enableLaunchAgent(t)
	case "linux":
		return enableSystemdUnit(t)
	default:
		return "", usageError("Beeper Server is not available on %s", runtime.GOOS)
	}
}

func disableProfile(t target) (string, error) {
	if !t.Managed || t.DataDir == "" || t.Type != "server" {
		return "", usageError("target %q is not a local Beeper Server install", t.ID)
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	switch runtime.GOOS {
	case "darwin":
		path := filepath.Join(home, "Library", "LaunchAgents", launchAgentName(t))
		service := "gui/" + strconv.Itoa(os.Getuid())
		_ = exec.Command("launchctl", "bootout", service, path).Run()
		_ = exec.Command("launchctl", "disable", service+"/"+launchAgentLabel(t)).Run()
		if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
			return "", err
		}
		return path, nil
	case "linux":
		path := filepath.Join(home, ".config", "systemd", "user", systemdUnitName(t))
		_ = exec.Command("systemctl", "--user", "disable", "--now", systemdUnitName(t)).Run()
		_ = exec.Command("systemctl", "--user", "daemon-reload").Run()
		if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
			return "", err
		}
		return path, nil
	default:
		return "", usageError("Beeper Server is not available on %s", runtime.GOOS)
	}
}

func enableLaunchAgent(t target) (string, error) {
	path, err := writeLaunchAgent(t)
	if err != nil {
		return "", err
	}
	if err := os.MkdirAll(profileLogDir(), 0o700); err != nil {
		return "", err
	}
	service := "gui/" + strconv.Itoa(os.Getuid())
	_ = exec.Command("launchctl", "bootout", service, path).Run()
	if err := exec.Command("launchctl", "bootstrap", service, path).Run(); err != nil {
		return "", err
	}
	if err := exec.Command("launchctl", "enable", service+"/"+launchAgentLabel(t)).Run(); err != nil {
		return "", err
	}
	_ = exec.Command("launchctl", "kickstart", "-k", service+"/"+launchAgentLabel(t)).Run()
	return path, nil
}

func enableSystemdUnit(t target) (string, error) {
	path, err := writeSystemdUnit(t)
	if err != nil {
		return "", err
	}
	if err := os.MkdirAll(profileLogDir(), 0o700); err != nil {
		return "", err
	}
	if err := exec.Command("systemctl", "--user", "daemon-reload").Run(); err != nil {
		return "", err
	}
	if err := exec.Command("systemctl", "--user", "enable", "--now", systemdUnitName(t)).Run(); err != nil {
		return "", err
	}
	return path, nil
}

func writeLaunchAgent(t target) (string, error) {
	binary, err := serverBinaryPath()
	if err != nil {
		return "", err
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	dir := filepath.Join(home, "Library", "LaunchAgents")
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return "", err
	}
	path := filepath.Join(dir, launchAgentName(t))
	return path, os.WriteFile(path, []byte(launchAgentPlist(t, binary)), 0o600)
}

func writeSystemdUnit(t target) (string, error) {
	binary, err := serverBinaryPath()
	if err != nil {
		return "", err
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	dir := filepath.Join(home, ".config", "systemd", "user")
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return "", err
	}
	path := filepath.Join(dir, systemdUnitName(t))
	return path, os.WriteFile(path, []byte(systemdUnit(t, binary)), 0o600)
}

func serverBinaryPath() (string, error) {
	if binary := os.Getenv("BEEPER_SERVER_BIN"); binary != "" {
		return binary, nil
	}
	installs, err := readInstallations()
	if err != nil {
		return "", err
	}
	if installs.Server != nil && installs.Server.Path != "" {
		return installs.Server.Path, nil
	}
	return "", usageError("Beeper Server is not installed. Run: beeper install server")
}

func launchAgentName(t target) string {
	return launchAgentLabel(t) + ".plist"
}

func launchAgentLabel(t target) string {
	return "com.beeper.cli.profile." + t.ID
}

func systemdUnitName(t target) string {
	return "beeper-profile-" + t.ID + ".service"
}

func launchAgentPlist(t target, binary string) string {
	args := append([]string{binary}, serverArgs(t)...)
	parts := []string{}
	for _, arg := range args {
		parts = append(parts, "<string>"+escapeXML(arg)+"</string>")
	}
	return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>` + escapeXML(launchAgentLabel(t)) + `</string>
<key>ProgramArguments</key><array>` + strings.Join(parts, "") + `</array>
<key>EnvironmentVariables</key><dict><key>BEEPER_SERVER_DATA_DIR</key><string>` + escapeXML(t.DataDir) + `</string></dict>
<key>RunAtLoad</key><true/>
<key>KeepAlive</key><true/>
<key>StandardOutPath</key><string>` + escapeXML(profileLogPath(t.ID)) + `</string>
<key>StandardErrorPath</key><string>` + escapeXML(profileErrorLogPath(t.ID)) + `</string>
</dict></plist>
`
}

func systemdUnit(t target, binary string) string {
	args := append([]string{binary}, serverArgs(t)...)
	quoted := []string{}
	for _, arg := range args {
		quoted = append(quoted, systemdQuote(arg))
	}
	return `[Unit]
Description=Beeper profile ` + t.ID + `

[Service]
ExecStart=` + strings.Join(quoted, " ") + `
Restart=always
Environment=BEEPER_SERVER_DATA_DIR=` + systemdQuote(t.DataDir) + `
StandardOutput=append:` + profileLogPath(t.ID) + `
StandardError=append:` + profileErrorLogPath(t.ID) + `

[Install]
WantedBy=default.target
`
}

func escapeXML(value string) string {
	value = strings.ReplaceAll(value, "&", "&amp;")
	value = strings.ReplaceAll(value, "<", "&lt;")
	value = strings.ReplaceAll(value, ">", "&gt;")
	return value
}

func systemdQuote(value string) string {
	if strings.ContainsAny(value, " \t\n\"'\\") {
		return `"` + strings.ReplaceAll(value, `"`, `\"`) + `"`
	}
	return value
}

func pidOrNil(run *profileRun) any {
	if run == nil {
		return nil
	}
	return run.PID
}

func startedAtOrNil(run *profileRun) any {
	if run == nil {
		return nil
	}
	return run.StartedAt
}

func serverArgs(t target) []string {
	port := t.Port
	if port == 0 {
		if parsed, err := url.Parse(t.BaseURL); err == nil {
			if p, _ := strconv.Atoi(parsed.Port()); p != 0 {
				port = p
			}
		}
	}
	args := []string{"--host=127.0.0.1", "--port=" + strconv.Itoa(port), "--data-dir=" + t.DataDir}
	if t.ServerEnv != "" {
		args = append(args, "--server-env="+t.ServerEnv)
	}
	return args
}
