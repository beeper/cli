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

var appE2eeRecoveryCodeResetCreate = cli.Command{
	Name:    "create",
	Usage:   "Create a new recovery key when the user cannot use the existing one.",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[string]{
			Name:     "recovery-code",
			Usage:    "Existing recovery key, if the user has it.",
			BodyPath: "recoveryCode",
		},
	},
	Action:          handleAppE2eeRecoveryCodeResetCreate,
	HideHelpCommand: true,
}

var appE2eeRecoveryCodeResetConfirm = cli.Command{
	Name:    "confirm",
	Usage:   "Confirm that the new recovery key should be used for this account.",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[string]{
			Name:     "recovery-code",
			Usage:    "New recovery key returned by the reset step.",
			Required: true,
			BodyPath: "recoveryCode",
		},
	},
	Action:          handleAppE2eeRecoveryCodeResetConfirm,
	HideHelpCommand: true,
}

func handleAppE2eeRecoveryCodeResetCreate(ctx context.Context, cmd *cli.Command) error {
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

	params := beeperdesktopapi.AppE2eeRecoveryCodeResetNewParams{}

	var res []byte
	options = append(options, option.WithResponseBodyInto(&res))
	_, err = client.App.E2ee.RecoveryCode.Reset.New(ctx, params, options...)
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
		Title:          "app:e2ee:recovery-code:reset create",
		Transform:      transform,
	})
}

func handleAppE2eeRecoveryCodeResetConfirm(ctx context.Context, cmd *cli.Command) error {
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

	params := beeperdesktopapi.AppE2eeRecoveryCodeResetConfirmParams{}

	var res []byte
	options = append(options, option.WithResponseBodyInto(&res))
	_, err = client.App.E2ee.RecoveryCode.Reset.Confirm(ctx, params, options...)
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
		Title:          "app:e2ee:recovery-code:reset confirm",
		Transform:      transform,
	})
}
