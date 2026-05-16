// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

package cmd

import (
	"bytes"
	"compress/gzip"
	"context"
	"fmt"
	"os"
	"path/filepath"
	"slices"
	"strings"

	"github.com/beeper/desktop-api-cli/internal/autocomplete"
	"github.com/beeper/desktop-api-cli/internal/requestflag"
	docs "github.com/urfave/cli-docs/v3"
	"github.com/urfave/cli/v3"
)

var (
	Command            *cli.Command
	CommandErrorBuffer bytes.Buffer
)

func init() {
	Command = &cli.Command{
		Name:      "beeper-desktop-cli",
		Usage:     "CLI for the beeperdesktop API",
		Suggest:   true,
		Version:   Version,
		ErrWriter: &CommandErrorBuffer,
		Flags: []cli.Flag{
			&cli.BoolFlag{
				Name:  "debug",
				Usage: "Enable debug logging",
			},
			&cli.StringFlag{
				Name:        "base-url",
				DefaultText: "url",
				Usage:       "Override the base URL for API requests",
				Validator: func(baseURL string) error {
					return ValidateBaseURL(baseURL, "--base-url")
				},
			},
			&cli.StringFlag{
				Name:  "format",
				Usage: "The format for displaying response data (one of: " + strings.Join(OutputFormats, ", ") + ")",
				Value: "json",
				Validator: func(format string) error {
					if !slices.Contains(OutputFormats, strings.ToLower(format)) {
						return fmt.Errorf("format must be one of: %s", strings.Join(OutputFormats, ", "))
					}
					return nil
				},
			},
			&cli.StringFlag{
				Name:  "format-error",
				Usage: "The format for displaying error data (one of: " + strings.Join(OutputFormats, ", ") + ")",
				Value: "json",
				Validator: func(format string) error {
					if !slices.Contains(OutputFormats, strings.ToLower(format)) {
						return fmt.Errorf("format must be one of: %s", strings.Join(OutputFormats, ", "))
					}
					return nil
				},
			},
			&cli.StringFlag{
				Name:  "transform",
				Usage: "The GJSON transformation for data output.",
			},
			&cli.StringFlag{
				Name:  "transform-error",
				Usage: "The GJSON transformation for errors.",
			},
			&cli.BoolFlag{
				Name:    "raw-output",
				Aliases: []string{"r"},
				Usage:   "If the result is a string, print it without JSON quotes. This can be useful for making output transforms talk to non-JSON-based systems.",
			},
			&requestflag.Flag[string]{
				Name:    "access-token",
				Usage:   "Bearer access token obtained via OAuth2 PKCE flow or created in-app. Required for all API operations.",
				Sources: cli.EnvVars("BEEPER_ACCESS_TOKEN"),
			},
		},
		Commands: []*cli.Command{
			&focus,
			&search,
			{
				Name:     "app",
				Category: "API RESOURCE",
				Suggest:  true,
				Commands: []*cli.Command{
					&appStatus,
				},
			},
			{
				Name:     "app:login",
				Category: "API RESOURCE",
				Suggest:  true,
				Commands: []*cli.Command{
					&appLoginEmail,
					&appLoginRegister,
					&appLoginResponse,
					&appLoginStart,
				},
			},
			{
				Name:     "app:e2ee:recovery-code",
				Category: "API RESOURCE",
				Suggest:  true,
				Commands: []*cli.Command{
					&appE2eeRecoveryCodeMarkBackedUp,
					&appE2eeRecoveryCodeVerify,
				},
			},
			{
				Name:     "app:e2ee:recovery-code:reset",
				Category: "API RESOURCE",
				Suggest:  true,
				Commands: []*cli.Command{
					&appE2eeRecoveryCodeResetCreate,
					&appE2eeRecoveryCodeResetConfirm,
				},
			},
			{
				Name:     "app:e2ee:verification",
				Category: "API RESOURCE",
				Suggest:  true,
				Commands: []*cli.Command{
					&appE2eeVerificationCreate,
					&appE2eeVerificationAccept,
					&appE2eeVerificationCancel,
				},
			},
			{
				Name:     "app:e2ee:verification:qr",
				Category: "API RESOURCE",
				Suggest:  true,
				Commands: []*cli.Command{
					&appE2eeVerificationQrConfirmScanned,
					&appE2eeVerificationQrScan,
				},
			},
			{
				Name:     "app:e2ee:verification:sas",
				Category: "API RESOURCE",
				Suggest:  true,
				Commands: []*cli.Command{
					&appE2eeVerificationSasConfirm,
					&appE2eeVerificationSasStart,
				},
			},
			{
				Name:     "accounts",
				Category: "API RESOURCE",
				Suggest:  true,
				Commands: []*cli.Command{
					&accountsList,
				},
			},
			{
				Name:     "accounts:contacts",
				Category: "API RESOURCE",
				Suggest:  true,
				Commands: []*cli.Command{
					&accountsContactsList,
					&accountsContactsSearch,
				},
			},
			{
				Name:     "bridges",
				Category: "API RESOURCE",
				Suggest:  true,
				Commands: []*cli.Command{
					&bridgesList,
				},
			},
			{
				Name:     "matrix:users",
				Category: "API RESOURCE",
				Suggest:  true,
				Commands: []*cli.Command{
					&matrixUsersRetrieveProfile,
				},
			},
			{
				Name:     "matrix:users:account-data",
				Category: "API RESOURCE",
				Suggest:  true,
				Commands: []*cli.Command{
					&matrixUsersAccountDataRetrieve,
					&matrixUsersAccountDataUpdate,
				},
			},
			{
				Name:     "matrix:rooms",
				Category: "API RESOURCE",
				Suggest:  true,
				Commands: []*cli.Command{
					&matrixRoomsCreate,
					&matrixRoomsJoin,
					&matrixRoomsLeave,
				},
			},
			{
				Name:     "matrix:rooms:account-data",
				Category: "API RESOURCE",
				Suggest:  true,
				Commands: []*cli.Command{
					&matrixRoomsAccountDataRetrieve,
					&matrixRoomsAccountDataUpdate,
				},
			},
			{
				Name:     "matrix:rooms:state",
				Category: "API RESOURCE",
				Suggest:  true,
				Commands: []*cli.Command{
					&matrixRoomsStateRetrieve,
					&matrixRoomsStateList,
				},
			},
			{
				Name:     "matrix:rooms:events",
				Category: "API RESOURCE",
				Suggest:  true,
				Commands: []*cli.Command{
					&matrixRoomsEventsRetrieve,
				},
			},
			{
				Name:     "matrix:bridges:auth",
				Category: "API RESOURCE",
				Suggest:  true,
				Commands: []*cli.Command{
					&matrixBridgesAuthListFlows,
					&matrixBridgesAuthListLogins,
					&matrixBridgesAuthLogout,
					&matrixBridgesAuthStartLogin,
					&matrixBridgesAuthSubmitCookies,
					&matrixBridgesAuthSubmitUserInput,
					&matrixBridgesAuthWaitForStep,
					&matrixBridgesAuthWhoami,
				},
			},
			{
				Name:     "matrix:bridges:contacts",
				Category: "API RESOURCE",
				Suggest:  true,
				Commands: []*cli.Command{
					&matrixBridgesContactsList,
				},
			},
			{
				Name:     "matrix:bridges:users",
				Category: "API RESOURCE",
				Suggest:  true,
				Commands: []*cli.Command{
					&matrixBridgesUsersResolve,
					&matrixBridgesUsersSearch,
				},
			},
			{
				Name:     "matrix:bridges:rooms",
				Category: "API RESOURCE",
				Suggest:  true,
				Commands: []*cli.Command{
					&matrixBridgesRoomsCreateDm,
					&matrixBridgesRoomsCreateGroup,
				},
			},
			{
				Name:     "matrix:bridges:capabilities",
				Category: "API RESOURCE",
				Suggest:  true,
				Commands: []*cli.Command{
					&matrixBridgesCapabilitiesRetrieve,
				},
			},
			{
				Name:     "chats",
				Category: "API RESOURCE",
				Suggest:  true,
				Commands: []*cli.Command{
					&chatsCreate,
					&chatsRetrieve,
					&chatsUpdate,
					&chatsList,
					&chatsArchive,
					&chatsMarkRead,
					&chatsMarkUnread,
					&chatsNotifyAnyway,
					&chatsSearch,
					&chatsStart,
				},
			},
			{
				Name:     "chats:reminders",
				Category: "API RESOURCE",
				Suggest:  true,
				Commands: []*cli.Command{
					&chatsRemindersCreate,
					&chatsRemindersDelete,
				},
			},
			{
				Name:     "chats:messages:reactions",
				Category: "API RESOURCE",
				Suggest:  true,
				Commands: []*cli.Command{
					&chatsMessagesReactionsDelete,
					&chatsMessagesReactionsAdd,
				},
			},
			{
				Name:     "messages",
				Category: "API RESOURCE",
				Suggest:  true,
				Commands: []*cli.Command{
					&messagesRetrieve,
					&messagesUpdate,
					&messagesList,
					&messagesDelete,
					&messagesSearch,
					&messagesSend,
				},
			},
			{
				Name:     "assets",
				Category: "API RESOURCE",
				Suggest:  true,
				Commands: []*cli.Command{
					&assetsDownload,
					&assetsServe,
					&assetsUpload,
					&assetsUploadBase64,
				},
			},
			{
				Name:     "info",
				Category: "API RESOURCE",
				Suggest:  true,
				Commands: []*cli.Command{
					&infoRetrieve,
				},
			},
			{
				Name:            "@manpages",
				Usage:           "Generate documentation for 'man'",
				UsageText:       "beeper-desktop-cli @manpages [-o beeper-desktop-cli.1] [--gzip]",
				Hidden:          true,
				Action:          generateManpages,
				HideHelpCommand: true,
				Flags: []cli.Flag{
					&cli.StringFlag{
						Name:    "output",
						Aliases: []string{"o"},
						Usage:   "write manpages to the given folder",
						Value:   "man",
					},
					&cli.BoolFlag{
						Name:    "gzip",
						Aliases: []string{"z"},
						Usage:   "output gzipped manpage files to .gz",
						Value:   true,
					},
					&cli.BoolFlag{
						Name:    "text",
						Aliases: []string{"z"},
						Usage:   "output uncompressed text files",
						Value:   false,
					},
				},
			},
			{
				Name:            "__complete",
				Hidden:          true,
				HideHelpCommand: true,
				Action:          autocomplete.ExecuteShellCompletion,
			},
			{
				Name:            "@completion",
				Hidden:          true,
				HideHelpCommand: true,
				Action:          autocomplete.OutputCompletionScript,
			},
		},
		HideHelpCommand: true,
	}
}

func generateManpages(ctx context.Context, c *cli.Command) error {
	manpage, err := docs.ToManWithSection(Command, 1)
	if err != nil {
		return err
	}
	dir := c.String("output")
	err = os.MkdirAll(filepath.Join(dir, "man1"), 0755)
	if err != nil {
		// handle error
	}
	if c.Bool("text") {
		file, err := os.Create(filepath.Join(dir, "man1", "beeper-desktop-cli.1"))
		if err != nil {
			return err
		}
		defer file.Close()
		if _, err := file.WriteString(manpage); err != nil {
			return err
		}
	}
	if c.Bool("gzip") {
		file, err := os.Create(filepath.Join(dir, "man1", "beeper-desktop-cli.1.gz"))
		if err != nil {
			return err
		}
		defer file.Close()
		gzWriter := gzip.NewWriter(file)
		defer gzWriter.Close()
		_, err = gzWriter.Write([]byte(manpage))
		if err != nil {
			return err
		}
	}
	fmt.Printf("Wrote manpages to %s\n", dir)
	return nil
}
