// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

package cmd

import (
	"context"
	"fmt"

	"github.com/beeper/desktop-api-cli/internal/apiquery"
	"github.com/beeper/desktop-api-cli/internal/requestflag"
	"github.com/beeper/desktop-api-go/v5"
	"github.com/beeper/desktop-api-go/v5/option"
	"github.com/tidwall/gjson"
	"github.com/urfave/cli/v3"
)

var focus = cli.Command{
	Name:    "focus",
	Usage:   "Focus Beeper Desktop and optionally open a specific chat, jump to a message, or\npre-fill text and an image.",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[string]{
			Name:     "chat-id",
			Usage:    "Optional Beeper chat ID (or local chat ID) to focus after opening the app. If omitted, only opens/focuses the app.",
			BodyPath: "chatID",
		},
		&requestflag.Flag[string]{
			Name:     "draft-attachment-path",
			Usage:    "Optional local image path to populate in the message input field.",
			BodyPath: "draftAttachmentPath",
		},
		&requestflag.Flag[string]{
			Name:     "draft-text",
			Usage:    "Optional plain text to populate in the message input field.",
			BodyPath: "draftText",
		},
		&requestflag.Flag[string]{
			Name:     "message-id",
			Usage:    "Optional message ID. Jumps to that message in the chat when opening.",
			BodyPath: "messageID",
		},
	},
	Action:          handleFocus,
	HideHelpCommand: true,
}

var search = cli.Command{
	Name:    "search",
	Usage:   "Return matching chats, participant matches in group chats, and the first page of\nmessage results in one call. Use the dedicated chat and message search endpoints\nfor pagination.",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[string]{
			Name:      "query",
			Usage:     "User-typed search text. Uses literal word matching.",
			Required:  true,
			QueryPath: "query",
		},
	},
	Action:          handleSearch,
	HideHelpCommand: true,
}

func handleFocus(ctx context.Context, cmd *cli.Command) error {
	client := beeperdesktopapi.NewClient(getDefaultRequestOptions(cmd)...)
	unusedArgs := cmd.Args().Slice()

	if len(unusedArgs) > 0 {
		return fmt.Errorf("Unexpected extra arguments: %v", unusedArgs)
	}

	options, err := flagOptions(
		cmd,
		apiquery.NestedQueryFormatBrackets,
		apiquery.ArrayQueryFormatRepeat,
		ApplicationJSON,
		false,
	)
	if err != nil {
		return err
	}

	params := beeperdesktopapi.FocusParams{}

	var res []byte
	options = append(options, option.WithResponseBodyInto(&res))
	_, err = client.Focus(ctx, params, options...)
	if err != nil {
		return err
	}

	obj := gjson.ParseBytes(res)
	format := cmd.Root().String("format")
	explicitFormat := cmd.Root().IsSet("format")
	transform := cmd.Root().String("transform")
	return ShowJSON(obj, ShowJSONOpts{
		ExplicitFormat: explicitFormat,
		Format:         format,
		RawOutput:      cmd.Root().Bool("raw-output"),
		Title:          "focus",
		Transform:      transform,
	})
}

func handleSearch(ctx context.Context, cmd *cli.Command) error {
	client := beeperdesktopapi.NewClient(getDefaultRequestOptions(cmd)...)
	unusedArgs := cmd.Args().Slice()

	if len(unusedArgs) > 0 {
		return fmt.Errorf("Unexpected extra arguments: %v", unusedArgs)
	}

	options, err := flagOptions(
		cmd,
		apiquery.NestedQueryFormatBrackets,
		apiquery.ArrayQueryFormatRepeat,
		EmptyBody,
		false,
	)
	if err != nil {
		return err
	}

	params := beeperdesktopapi.SearchParams{}

	var res []byte
	options = append(options, option.WithResponseBodyInto(&res))
	_, err = client.Search(ctx, params, options...)
	if err != nil {
		return err
	}

	obj := gjson.ParseBytes(res)
	format := cmd.Root().String("format")
	explicitFormat := cmd.Root().IsSet("format")
	transform := cmd.Root().String("transform")
	return ShowJSON(obj, ShowJSONOpts{
		ExplicitFormat: explicitFormat,
		Format:         format,
		RawOutput:      cmd.Root().Bool("raw-output"),
		Title:          "search",
		Transform:      transform,
	})
}
