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

var appE2eeVerificationCreate = cli.Command{
	Name:    "create",
	Usage:   "Start verifying this device from another signed-in device.",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[string]{
			Name:     "user-id",
			Usage:    "User ID to verify. Defaults to the signed-in user.",
			BodyPath: "userID",
		},
	},
	Action:          handleAppE2eeVerificationCreate,
	HideHelpCommand: true,
}

var appE2eeVerificationAccept = cli.Command{
	Name:    "accept",
	Usage:   "Accept an incoming device verification request.",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[string]{
			Name:      "verification-id",
			Usage:     "Verification ID.",
			Required:  true,
			PathParam: "verificationID",
		},
	},
	Action:          handleAppE2eeVerificationAccept,
	HideHelpCommand: true,
}

var appE2eeVerificationCancel = cli.Command{
	Name:    "cancel",
	Usage:   "Cancel an active device verification request.",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[string]{
			Name:      "verification-id",
			Usage:     "Verification ID.",
			Required:  true,
			PathParam: "verificationID",
		},
		&requestflag.Flag[string]{
			Name:     "code",
			Usage:    "Optional cancellation code.",
			BodyPath: "code",
		},
		&requestflag.Flag[string]{
			Name:     "reason",
			Usage:    "Optional user-facing cancellation reason.",
			BodyPath: "reason",
		},
	},
	Action:          handleAppE2eeVerificationCancel,
	HideHelpCommand: true,
}

func handleAppE2eeVerificationCreate(ctx context.Context, cmd *cli.Command) error {
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

	params := beeperdesktopapi.AppE2eeVerificationNewParams{}

	var res []byte
	options = append(options, option.WithResponseBodyInto(&res))
	_, err = client.App.E2ee.Verification.New(ctx, params, options...)
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
		Title:          "app:e2ee:verification create",
		Transform:      transform,
	})
}

func handleAppE2eeVerificationAccept(ctx context.Context, cmd *cli.Command) error {
	client := beeperdesktopapi.NewClient(getDefaultRequestOptions(cmd)...)
	unusedArgs := cmd.Args().Slice()
	if !cmd.IsSet("verification-id") && len(unusedArgs) > 0 {
		cmd.Set("verification-id", unusedArgs[0])
		unusedArgs = unusedArgs[1:]
	}
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
	_, err = client.App.E2ee.Verification.Accept(ctx, cmd.Value("verification-id").(string), options...)
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
		Title:          "app:e2ee:verification accept",
		Transform:      transform,
	})
}

func handleAppE2eeVerificationCancel(ctx context.Context, cmd *cli.Command) error {
	client := beeperdesktopapi.NewClient(getDefaultRequestOptions(cmd)...)
	unusedArgs := cmd.Args().Slice()
	if !cmd.IsSet("verification-id") && len(unusedArgs) > 0 {
		cmd.Set("verification-id", unusedArgs[0])
		unusedArgs = unusedArgs[1:]
	}
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

	params := beeperdesktopapi.AppE2eeVerificationCancelParams{}

	var res []byte
	options = append(options, option.WithResponseBodyInto(&res))
	_, err = client.App.E2ee.Verification.Cancel(
		ctx,
		cmd.Value("verification-id").(string),
		params,
		options...,
	)
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
		Title:          "app:e2ee:verification cancel",
		Transform:      transform,
	})
}
