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

var appE2eeRecoveryCodeMarkBackedUp = cli.Command{
	Name:            "mark-backed-up",
	Usage:           "Record that the user saved their recovery key.",
	Suggest:         true,
	Flags:           []cli.Flag{},
	Action:          handleAppE2eeRecoveryCodeMarkBackedUp,
	HideHelpCommand: true,
}

var appE2eeRecoveryCodeVerify = cli.Command{
	Name:    "verify",
	Usage:   "Unlock encrypted messages with the user recovery key.",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[string]{
			Name:     "recovery-code",
			Usage:    "Recovery key saved by the user.",
			Required: true,
			BodyPath: "recoveryCode",
		},
	},
	Action:          handleAppE2eeRecoveryCodeVerify,
	HideHelpCommand: true,
}

func handleAppE2eeRecoveryCodeMarkBackedUp(ctx context.Context, cmd *cli.Command) error {
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

	var res []byte
	options = append(options, option.WithResponseBodyInto(&res))
	_, err = client.App.E2ee.RecoveryCode.MarkBackedUp(ctx, options...)
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
		Title:          "app:e2ee:recovery-code mark-backed-up",
		Transform:      transform,
	})
}

func handleAppE2eeRecoveryCodeVerify(ctx context.Context, cmd *cli.Command) error {
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

	params := beeperdesktopapi.AppE2eeRecoveryCodeVerifyParams{}

	var res []byte
	options = append(options, option.WithResponseBodyInto(&res))
	_, err = client.App.E2ee.RecoveryCode.Verify(ctx, params, options...)
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
		Title:          "app:e2ee:recovery-code verify",
		Transform:      transform,
	})
}
