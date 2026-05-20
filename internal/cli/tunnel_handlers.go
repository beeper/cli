package cli

import (
	"context"
	"fmt"
	"net/url"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/beeper/desktop-api-cli/internal/cloudflare"
	"github.com/spf13/cobra"
)

func addTunnelFlags(cmd *cobra.Command) {
	cmd.Flags().Bool("install", false, "Download the pinned cloudflared binary if it is missing or outdated")
	cmd.Flags().String("cloudflared-path", "", "Path to a cloudflared binary. Also configurable with BEEPER_CLOUDFLARED_PATH.")
	cmd.Flags().Int("retries", 5, "Number of startup retries before giving up")
	cmd.Flags().Bool("url-only", false, "Print only the public tunnel URL")
	cmd.Flags().String("url", "", "Local target URL to expose. Defaults to --base-url or BEEPER_DESKTOP_BASE_URL.")
}

func runTunnelCommand(opts *globalOptions, cmd *cobra.Command, args []string) error {
	rawURL, _ := cmd.Flags().GetString("url")
	if rawURL == "" {
		rawURL = opts.BaseURL
	}
	if rawURL == "" {
		rawURL = os.Getenv("BEEPER_DESKTOP_BASE_URL")
	}
	if rawURL == "" {
		rawURL = "http://localhost:23373/"
	}
	localURL, err := normalizeLocalURL(rawURL)
	if err != nil {
		return err
	}
	install, _ := cmd.Flags().GetBool("install")
	path, _ := cmd.Flags().GetString("cloudflared-path")
	retries, _ := cmd.Flags().GetInt("retries")
	urlOnly, _ := cmd.Flags().GetBool("url-only")
	timeout := 40 * time.Second
	if opts.Timeout != "" {
		timeout, err = time.ParseDuration(opts.Timeout)
		if err != nil {
			return usageError("invalid --timeout %q: %v", opts.Timeout, err)
		}
	}

	started, err := cloudflare.StartTunnel(context.Background(), cloudflare.StartOptions{
		CloudflaredPath: path,
		Debug:           opts.Debug,
		Install:         install,
		Retries:         retries,
		Timeout:         timeout,
		URL:             localURL,
	})
	if err != nil {
		return err
	}
	if opts.Events {
		writeEvent("tunnel.connected", map[string]any{"localURL": localURL, "url": started.URL})
	}
	if urlOnly {
		fmt.Fprintln(cmd.OutOrStdout(), started.URL)
	} else if err := printData(opts, map[string]any{"localURL": localURL, "url": started.URL, "cloudflaredPath": cloudflare.CloudflaredPath(path)}); err != nil {
		return err
	}

	signals := make(chan os.Signal, 1)
	signal.Notify(signals, syscall.SIGINT, syscall.SIGTERM)
	defer signal.Stop(signals)
	select {
	case <-signals:
		if started.Cmd.Process != nil {
			_ = started.Cmd.Process.Signal(syscall.SIGTERM)
		}
		return nil
	case err := <-started.Done:
		if err != nil {
			return fmt.Errorf("cloudflared exited after the tunnel connected: %w\n%s", err, started.TryMessage)
		}
		return nil
	}
}

func normalizeLocalURL(value string) (string, error) {
	parsed, err := url.Parse(value)
	if err != nil {
		return "", err
	}
	parsed.RawQuery = ""
	parsed.Fragment = ""
	return strings.TrimRight(parsed.String(), "/"), nil
}
