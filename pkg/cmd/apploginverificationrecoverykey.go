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

var appLoginVerificationRecoveryKeyVerify = cli.Command{
	Name:    "verify",
	Usage:   "Unlock encrypted messages with the user recovery key.",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[string]{
			Name:     "recovery-key",
			Usage:    "Recovery key saved by the user.",
			Required: true,
			BodyPath: "recoveryKey",
		},
	},
	Action:          handleAppLoginVerificationRecoveryKeyVerify,
	HideHelpCommand: true,
}

func handleAppLoginVerificationRecoveryKeyVerify(ctx context.Context, cmd *cli.Command) error {
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

	params := beeperdesktopapi.AppLoginVerificationRecoveryKeyVerifyParams{}

	var res []byte
	options = append(options, option.WithResponseBodyInto(&res))
	_, err = client.App.Login.Verification.RecoveryKey.Verify(ctx, params, options...)
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
		Title:          "app:login:verification:recovery-key verify",
		Transform:      transform,
	})
}
