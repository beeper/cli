package cloudflare

import (
	"archive/tar"
	"compress/gzip"
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"
	"time"
)

const CurrentCloudflaredVersion = "2024.8.2"

type StartOptions struct {
	CloudflaredPath string
	Debug           bool
	Install         bool
	Retries         int
	Timeout         time.Duration
	URL             string
}

type StartedTunnel struct {
	Cmd        *exec.Cmd
	Done       <-chan error
	TryMessage string
	URL        string
}

func DefaultCloudflaredPath() string {
	name := "cloudflared"
	if runtime.GOOS == "windows" {
		name = "cloudflared.exe"
	}
	dir, err := os.UserCacheDir()
	if err != nil {
		dir = os.TempDir()
	}
	return filepath.Join(dir, "beeper-cli", "bin", name)
}

func CloudflaredPath(explicit string) string {
	if explicit != "" {
		return explicit
	}
	if env := os.Getenv("BEEPER_CLOUDFLARED_PATH"); env != "" {
		return env
	}
	return DefaultCloudflaredPath()
}

func EnsureCloudflared(ctx context.Context, opts StartOptions) (string, error) {
	target := CloudflaredPath(opts.CloudflaredPath)
	if truthy(os.Getenv("BEEPER_IGNORE_CLOUDFLARED")) {
		return target, nil
	}
	if isUsableCloudflared(ctx, target) {
		return target, nil
	}
	if !opts.Install {
		return "", fmt.Errorf("cloudflared not found at %s. Install it or rerun with --install.\n%s", target, WhatToTry())
	}
	if err := InstallCloudflared(ctx, target); err != nil {
		return "", err
	}
	return target, nil
}

func InstallCloudflared(ctx context.Context, target string) error {
	url, err := DownloadURL(runtime.GOOS, runtime.GOARCH)
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
		return err
	}
	tmp := target + ".download"
	if strings.HasSuffix(url, ".tgz") {
		tmp = target + ".tgz"
	}
	if err := downloadFile(ctx, url, tmp); err != nil {
		return err
	}
	if strings.HasSuffix(url, ".tgz") {
		if err := extractCloudflared(tmp, filepath.Dir(target), target); err != nil {
			return err
		}
		_ = os.Remove(tmp)
	} else if err := os.Rename(tmp, target); err != nil {
		return err
	}
	if runtime.GOOS != "windows" {
		return os.Chmod(target, 0o755)
	}
	return nil
}

func StartTunnel(ctx context.Context, opts StartOptions) (*StartedTunnel, error) {
	bin, err := EnsureCloudflared(ctx, opts)
	if err != nil {
		return nil, err
	}
	retries := opts.Retries
	if retries == 0 {
		retries = 5
	}
	var last error
	for attempt := 0; attempt <= retries; attempt++ {
		started, err := runCloudflared(ctx, bin, opts)
		if err == nil {
			return started, nil
		}
		last = err
		if attempt < retries {
			time.Sleep(time.Second)
		}
	}
	return nil, fmt.Errorf("could not start Cloudflare Tunnel: max retries reached: %w\n%s", last, WhatToTry())
}

func runCloudflared(ctx context.Context, bin string, opts StartOptions) (*StartedTunnel, error) {
	timeout := opts.Timeout
	if timeout == 0 {
		timeout = 40 * time.Second
	}
	ctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, bin, "tunnel", "--url", opts.URL, "--no-autoupdate")
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, err
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return nil, err
	}
	if err := cmd.Start(); err != nil {
		return nil, err
	}

	lines := make(chan string, 32)
	go scanOutput(stdout, lines)
	go scanOutput(stderr, lines)
	done := make(chan error, 1)
	go func() { done <- cmd.Wait() }()

	var publicURL string
	var connected bool
	var knownErrors []string
	for {
		select {
		case line := <-lines:
			if opts.Debug {
				_, _ = os.Stderr.WriteString(line)
			}
			if publicURL == "" {
				publicURL = FindTunnelURL(line, CloudflaredDomain())
			}
			connected = connected || hasConnection(line)
			if known := FindKnownError(line); known != "" {
				knownErrors = append(knownErrors, known)
			}
			if publicURL != "" && connected {
				return &StartedTunnel{Cmd: cmd, Done: done, TryMessage: WhatToTry(), URL: publicURL}, nil
			}
		case err := <-done:
			if err == nil {
				err = errors.New("cloudflared exited before connecting")
			}
			if msg := lastTunnelError(knownErrors); msg != "" {
				return nil, fmt.Errorf("%s\n%s", msg, WhatToTry())
			}
			return nil, err
		case <-ctx.Done():
			_ = cmd.Process.Kill()
			if msg := lastTunnelError(knownErrors); msg != "" {
				return nil, fmt.Errorf("%s\n%s", msg, WhatToTry())
			}
			return nil, fmt.Errorf("could not start Cloudflare Tunnel: timed out waiting for a public URL.\n%s", WhatToTry())
		}
	}
}

func scanOutput(r io.Reader, lines chan<- string) {
	buf := make([]byte, 4096)
	for {
		n, err := r.Read(buf)
		if n > 0 {
			lines <- string(buf[:n])
		}
		if err != nil {
			return
		}
	}
}

func isUsableCloudflared(ctx context.Context, path string) bool {
	if _, err := os.Stat(path); err != nil {
		return false
	}
	out, err := exec.CommandContext(ctx, path, "--version").Output()
	if err != nil {
		return false
	}
	fields := strings.Fields(string(out))
	version := "0.0.0"
	if len(fields) >= 3 {
		version = fields[2]
	}
	return !VersionIsGreaterThan(CurrentCloudflaredVersion, version)
}

func DownloadURL(system, arch string) (string, error) {
	name := ""
	switch system {
	case "linux":
		switch arch {
		case "arm64":
			name = "cloudflared-linux-arm64"
		case "arm":
			name = "cloudflared-linux-arm"
		case "amd64":
			name = "cloudflared-linux-amd64"
		case "386":
			name = "cloudflared-linux-386"
		}
	case "darwin":
		switch arch {
		case "arm64":
			name = "cloudflared-darwin-arm64.tgz"
		case "amd64":
			name = "cloudflared-darwin-amd64.tgz"
		}
	case "windows":
		switch arch {
		case "arm64", "amd64":
			name = "cloudflared-windows-amd64.exe"
		case "386":
			name = "cloudflared-windows-386.exe"
		}
	}
	if name == "" {
		return "", fmt.Errorf("unsupported system or architecture: %s/%s", system, arch)
	}
	return "https://github.com/cloudflare/cloudflared/releases/download/" + CurrentCloudflaredVersion + "/" + name, nil
}

func downloadFile(ctx context.Context, url, target string) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return err
	}
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode < 200 || res.StatusCode > 299 {
		return fmt.Errorf("could not download %s: %s", url, res.Status)
	}
	out, err := os.Create(target)
	if err != nil {
		return err
	}
	defer out.Close()
	_, err = io.Copy(out, res.Body)
	return err
}

func extractCloudflared(archive, destination, target string) error {
	file, err := os.Open(archive)
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
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			return err
		}
		if filepath.Base(header.Name) != "cloudflared" {
			continue
		}
		out, err := os.Create(filepath.Join(destination, "cloudflared"))
		if err != nil {
			return err
		}
		if _, err := io.Copy(out, tr); err != nil {
			_ = out.Close()
			return err
		}
		_ = out.Close()
		return os.Rename(filepath.Join(destination, "cloudflared"), target)
	}
	return errors.New("cloudflared archive did not contain cloudflared")
}

func FindTunnelURL(data, domain string) string {
	if domain == "" {
		domain = CloudflaredDomain()
	}
	re := regexp.MustCompile(`https://[^\s]+\.` + regexp.QuoteMeta(domain))
	return re.FindString(data)
}

func hasConnection(data string) bool {
	return strings.Contains(data, "INF Registered tunnel connection") || strings.Contains(data, "INF Connection")
}

func FindKnownError(data string) string {
	known := []*regexp.Regexp{
		regexp.MustCompile(`(?i)failed to request quick Tunnel`),
		regexp.MustCompile(`(?i)failed to unmarshal quick Tunnel`),
		regexp.MustCompile(`(?i)failed to parse quick Tunnel ID`),
		regexp.MustCompile(`(?i)failed to provision routing`),
		regexp.MustCompile(`(?i)ERR Couldn't start tunnel`),
		regexp.MustCompile(`(?i)ERR Failed to serve quic connection`),
		regexp.MustCompile(`(?i)ERR Failed to create new quic connection error`),
	}
	for _, re := range known {
		if re.MatchString(data) {
			return "Could not start Cloudflare Tunnel: " + cleanCloudflareLog(data)
		}
	}
	return ""
}

func cleanCloudflareLog(input string) string {
	re := regexp.MustCompile(`^[0-9TZ:-]+ (ERR )?`)
	return strings.TrimSpace(regexp.MustCompile(`connIndex.*`).ReplaceAllString(re.ReplaceAllString(input, ""), ""))
}

func lastTunnelError(errors []string) string {
	if len(errors) == 0 {
		return ""
	}
	seen := map[string]bool{}
	out := []string{}
	for _, err := range errors {
		if !seen[err] {
			seen[err] = true
			out = append(out, err)
		}
	}
	if len(out) > 5 {
		out = out[len(out)-5:]
	}
	return strings.Join(out, "\n")
}

func CloudflaredDomain() string {
	if env := os.Getenv("BEEPER_CLOUDFLARED_DOMAIN"); env != "" {
		return env
	}
	return "trycloudflare.com"
}

func WhatToTry() string {
	return strings.Join([]string{
		"Try running the command again.",
		"If cloudflared is already installed, set BEEPER_CLOUDFLARED_PATH or pass --cloudflared-path.",
		"If the bundled binary is missing, rerun with --install.",
		"For a stable hostname, configure a named Cloudflare Tunnel and route the Beeper target outside this quick-tunnel command.",
	}, " ")
}

func VersionIsGreaterThan(a, b string) bool {
	ap := parseVersion(a)
	bp := parseVersion(b)
	for i := range ap {
		if ap[i] != bp[i] {
			return ap[i] > bp[i]
		}
	}
	return false
}

func parseVersion(value string) [3]int {
	var out [3]int
	parts := strings.Split(value, ".")
	for i := 0; i < len(parts) && i < 3; i++ {
		fmt.Sscanf(parts[i], "%d", &out[i])
	}
	return out
}

func truthy(value string) bool {
	switch strings.ToLower(value) {
	case "1", "on", "true", "yes":
		return true
	default:
		return false
	}
}
