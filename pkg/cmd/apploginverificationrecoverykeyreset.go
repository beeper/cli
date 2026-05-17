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

var appLoginVerificationRecoveryKeyResetCreate = cli.Command{
	Name:    "create",
	Usage:   "Create a new recovery key when the user cannot use the existing one.",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[string]{
			Name:     "existing-recovery-key",
			Usage:    "Existing recovery key, if the user has it.",
			BodyPath: "existingRecoveryKey",
		},
	},
	Action:          handleAppLoginVerificationRecoveryKeyResetCreate,
	HideHelpCommand: true,
}

var appLoginVerificationRecoveryKeyResetConfirm = cli.Command{
	Name:    "confirm",
	Usage:   "Confirm that the new recovery key should be used for this account.",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[string]{
			Name:     "recovery-key",
			Usage:    "New recovery key returned by the reset step.",
			Required: true,
			BodyPath: "recoveryKey",
		},
	},
	Action:          handleAppLoginVerificationRecoveryKeyResetConfirm,
	HideHelpCommand: true,
}

func handleAppLoginVerificationRecoveryKeyResetCreate(ctx context.Context, cmd *cli.Command) error {
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

	params := beeperdesktopapi.AppLoginVerificationRecoveryKeyResetNewParams{}

	var res []byte
	options = append(options, option.WithResponseBodyInto(&res))
	_, err = client.App.Login.Verification.RecoveryKey.Reset.New(ctx, params, options...)
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
		Title:          "app:login:verification:recovery-key:reset create",
		Transform:      transform,
	})
}

func handleAppLoginVerificationRecoveryKeyResetConfirm(ctx context.Context, cmd *cli.Command) error {
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

	params := beeperdesktopapi.AppLoginVerificationRecoveryKeyResetConfirmParams{}

	var res []byte
	options = append(options, option.WithResponseBodyInto(&res))
	_, err = client.App.Login.Verification.RecoveryKey.Reset.Confirm(ctx, params, options...)
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
		Title:          "app:login:verification:recovery-key:reset confirm",
		Transform:      transform,
	})
}
