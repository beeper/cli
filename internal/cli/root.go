package cli

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/beeper/desktop-api-cli/internal/buildinfo"
	"github.com/beeper/desktop-api-cli/internal/ui"
	"github.com/spf13/cobra"
)

type globalOptions struct {
	BaseURL  string
	Target   string
	Debug    bool
	Events   bool
	Full     bool
	JSON     bool
	Quiet    bool
	ReadOnly bool
	Timeout  string
	Yes      bool
}

func NewRootCommand() *cobra.Command {
	opts := &globalOptions{}
	root := &cobra.Command{
		Use:           "beeper",
		Short:         "Beeper CLI",
		SilenceUsage:  true,
		SilenceErrors: true,
		Version:       buildinfo.Version,
		PersistentPreRun: func(cmd *cobra.Command, args []string) {
			if opts.Quiet {
				_ = os.Setenv("BEEPER_QUIET", "1")
			}
		},
	}

	root.PersistentFlags().StringVar(&opts.BaseURL, "base-url", "", "Beeper Desktop API base URL (overrides --target)")
	root.PersistentFlags().StringVarP(&opts.Target, "target", "t", "", "Named Beeper target to use for this command")
	root.PersistentFlags().BoolVar(&opts.Debug, "debug", false, "Print SDK debug logging on stderr")
	root.PersistentFlags().BoolVar(&opts.Events, "events", false, "Emit NDJSON lifecycle events on stderr (long-running commands)")
	root.PersistentFlags().BoolVar(&opts.Full, "full", false, "Disable text-output truncation; print full IDs and bodies")
	root.PersistentFlags().BoolVar(&opts.JSON, "json", false, "Print machine-readable JSON envelope on stdout")
	root.PersistentFlags().BoolVarP(&opts.Quiet, "quiet", "q", false, "Suppress spinners and success lines (errors still print). Honored with or without --json.")
	root.PersistentFlags().BoolVar(&opts.ReadOnly, "read-only", false, "Reject commands that would modify Beeper or local CLI state (or set BEEPER_READONLY=1)")
	root.PersistentFlags().StringVar(&opts.Timeout, "timeout", "", "Maximum time to wait, such as 30s, 2m, or 1h")
	root.PersistentFlags().BoolVarP(&opts.Yes, "yes", "y", false, "Skip interactive confirmation prompts")

	root.SetFlagErrorFunc(func(cmd *cobra.Command, err error) error {
		return usageError("%s", err)
	})

	root.AddCommand(newCompletionCommand(root))
	root.AddCommand(newVersionCommand())
	root.AddCommand(newCompleteCommand(opts))
	registerGeneratedCommands(root, opts)
	return root
}

func ensureWritable(opts *globalOptions) error {
	env := strings.ToLower(os.Getenv("BEEPER_READONLY"))
	if opts.ReadOnly || env == "1" || env == "true" || env == "yes" || env == "on" {
		return usageError("read-only mode: command would modify Beeper or local CLI state")
	}
	return nil
}

func writeEvent(event string, data map[string]any) {
	if data == nil {
		data = map[string]any{}
	}
	payload := map[string]any{"event": event, "data": data, "ts": time.Now().UnixMilli()}
	b, _ := json.Marshal(payload)
	fmt.Fprintln(os.Stderr, string(b))
}

func printData(opts *globalOptions, data any) error {
	if opts.JSON {
		return json.NewEncoder(os.Stdout).Encode(map[string]any{
			"success": true,
			"data":    data,
			"error":   nil,
		})
	}
	switch v := data.(type) {
	case string:
		if v != "" {
			fmt.Fprintln(os.Stdout, v)
		}
	default:
		rendered := ui.RenderHuman(data)
		if rendered != "" {
			fmt.Fprintln(os.Stdout, rendered)
		}
	}
	return nil
}
