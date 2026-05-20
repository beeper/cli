package cli

import (
	"fmt"

	"github.com/beeper/desktop-api-cli/internal/buildinfo"
	"github.com/spf13/cobra"
)

func newVersionCommand() *cobra.Command {
	return &cobra.Command{
		Use:   "version",
		Short: "Print the Beeper CLI version",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Fprintf(cmd.OutOrStdout(), "beeper %s\n", buildinfo.Version)
		},
	}
}
