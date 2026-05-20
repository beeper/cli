package cli

import (
	"io"
	"net/url"
	"os"
	"path/filepath"
	"time"

	"github.com/beeper/desktop-api-cli/internal/desktopapi"
	beeperdesktopapi "github.com/beeper/desktop-api-go/v5"
	"github.com/spf13/cobra"
)

func addMediaFlags(cmd *cobra.Command, spec commandSpec) {
	if spec.Name == "media:download" {
		cmd.Flags().StringP("out", "o", ".", "Output directory; pass - to stream the file to stdout")
	}
}

func addPresenceFlags(cmd *cobra.Command, spec commandSpec) {
	if spec.Name != "presence" {
		return
	}
	cmd.Flags().String("chat", "", "Chat selector (ID, local ID, title, or search text)")
	cmd.Flags().Int("pick", 0, "Pick the Nth result when the selector is ambiguous (1-indexed)")
	cmd.Flags().String("state", "typing", "Indicator to send: typing or paused")
	cmd.Flags().Int("duration", 0, "When --state is typing, send paused automatically after this many seconds")
}

func runMediaCommand(opts *globalOptions, spec commandSpec, cmd *cobra.Command, args []string) error {
	client, ctx, cancel, err := newClient(opts)
	if err != nil {
		return err
	}
	defer cancel()

	switch spec.Name {
	case "media:download":
		mediaURL := flagOrPos(cmd, args, "url", 0)
		if mediaURL == "" {
			return usageError("missing media URL")
		}
		res, err := client.Assets.Serve(ctx, beeperdesktopapi.AssetServeParams{URL: mediaURL})
		if err != nil {
			return err
		}
		defer res.Body.Close()
		out, _ := cmd.Flags().GetString("out")
		if out == "-" {
			_, err := io.Copy(os.Stdout, res.Body)
			return err
		}
		if err := os.MkdirAll(out, 0o755); err != nil {
			return err
		}
		name := "media"
		if parsed, err := url.Parse(mediaURL); err == nil {
			if base := filepath.Base(parsed.Path); base != "." && base != "/" {
				name = base
			}
		}
		path := filepath.Join(out, name)
		file, err := os.Create(path)
		if err != nil {
			return err
		}
		bytes, copyErr := io.Copy(file, res.Body)
		closeErr := file.Close()
		if copyErr != nil {
			return copyErr
		}
		if closeErr != nil {
			return closeErr
		}
		return printData(opts, map[string]any{"path": path, "bytes": bytes})
	default:
		return usageError("%s is registered but no typed media SDK method is available", spec.Name)
	}
}

func runPresenceCommand(opts *globalOptions, spec commandSpec, cmd *cobra.Command, args []string) error {
	client, ctx, cancel, err := newClient(opts)
	if err != nil {
		return err
	}
	defer cancel()

	chatID, err := resolveChatFromFlags(ctx, client, cmd, args)
	if err != nil {
		return err
	}
	stateValue := firstFlag(cmd, "state")
	if stateValue == "" {
		stateValue = string(desktopapi.TypingStateTyping)
	}
	var state desktopapi.TypingState
	switch stateValue {
	case string(desktopapi.TypingStateTyping):
		state = desktopapi.TypingStateTyping
	case string(desktopapi.TypingStatePaused):
		state = desktopapi.TypingStatePaused
	default:
		return usageError("--state must be typing or paused")
	}
	duration, _ := cmd.Flags().GetInt("duration")
	if duration < 0 {
		return usageError("--duration must be a positive integer")
	}
	if duration > 0 && state != desktopapi.TypingStateTyping {
		return usageError("--duration only applies when --state is typing")
	}
	res, err := desktopapi.SetTyping(ctx, client, chatID, desktopapi.SetTypingParams{State: state})
	if err != nil {
		return err
	}
	if duration == 0 {
		return printData(opts, res)
	}
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-time.After(time.Duration(duration) * time.Second):
	}
	paused, err := desktopapi.SetTyping(ctx, client, chatID, desktopapi.SetTypingParams{State: desktopapi.TypingStatePaused})
	if err != nil {
		return err
	}
	return printData(opts, map[string]any{"chatID": chatID, "state": paused.State, "durationSeconds": duration})
}
