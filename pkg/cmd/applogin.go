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

var appLoginEmail = cli.Command{
	Name:    "email",
	Usage:   "Send a sign-in code to the user email address for app setup.",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[string]{
			Name:     "email",
			Usage:    "Email address to send the sign-in code to.",
			Required: true,
			BodyPath: "email",
		},
		&requestflag.Flag[string]{
			Name:     "setup-request-id",
			Usage:    "Setup request ID returned by the start step.",
			Required: true,
			BodyPath: "setupRequestID",
		},
	},
	Action:          handleAppLoginEmail,
	HideHelpCommand: true,
}

var appLoginRegister = cli.Command{
	Name:    "register",
	Usage:   "Create a Beeper account after the user chooses a username and accepts the Terms\nof Use.",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[bool]{
			Name:     "accept-terms",
			Usage:    "Confirms that the user agreed to our [terms of use](https://www.beeper.com/terms-onboarding) and has read our [privacy policy](https://www.beeper.com/privacy).",
			Default:  true,
			Const:    true,
			BodyPath: "acceptTerms",
		},
		&requestflag.Flag[string]{
			Name:     "lead-token",
			Usage:    "Registration token returned by Beeper.",
			Required: true,
			BodyPath: "leadToken",
		},
		&requestflag.Flag[string]{
			Name:     "setup-request-id",
			Usage:    "Setup request ID returned by the start step.",
			Required: true,
			BodyPath: "setupRequestID",
		},
		&requestflag.Flag[string]{
			Name:     "username",
			Usage:    "Username selected by the user.",
			Required: true,
			BodyPath: "username",
		},
	},
	Action:          handleAppLoginRegister,
	HideHelpCommand: true,
}

var appLoginResponse = cli.Command{
	Name:    "response",
	Usage:   "Finish setup sign-in with the code sent to the user email address. If the user\nneeds a new account, the response includes account creation copy and username\nsuggestions.",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[string]{
			Name:     "response",
			Usage:    "Sign-in code from the user email.",
			Required: true,
			BodyPath: "response",
		},
		&requestflag.Flag[string]{
			Name:     "setup-request-id",
			Usage:    "Setup request ID returned by the start step.",
			Required: true,
			BodyPath: "setupRequestID",
		},
	},
	Action:          handleAppLoginResponse,
	HideHelpCommand: true,
}

var appLoginStart = cli.Command{
	Name:            "start",
	Usage:           "Start setting up Beeper Desktop or Beeper Server. The flow supports existing\nBeeper accounts and new account creation.",
	Suggest:         true,
	Flags:           []cli.Flag{},
	Action:          handleAppLoginStart,
	HideHelpCommand: true,
}

func handleAppLoginEmail(ctx context.Context, cmd *cli.Command) error {
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

	params := beeperdesktopapi.AppLoginEmailParams{}

	return client.App.Login.Email(ctx, params, options...)
}

func handleAppLoginRegister(ctx context.Context, cmd *cli.Command) error {
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

	params := beeperdesktopapi.AppLoginRegisterParams{}

	var res []byte
	options = append(options, option.WithResponseBodyInto(&res))
	_, err = client.App.Login.Register(ctx, params, options...)
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
		Title:          "app:login register",
		Transform:      transform,
	})
}

func handleAppLoginResponse(ctx context.Context, cmd *cli.Command) error {
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

	params := beeperdesktopapi.AppLoginResponseParams{}

	var res []byte
	options = append(options, option.WithResponseBodyInto(&res))
	_, err = client.App.Login.Response(ctx, params, options...)
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
		Title:          "app:login response",
		Transform:      transform,
	})
}

func handleAppLoginStart(ctx context.Context, cmd *cli.Command) error {
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
	_, err = client.App.Login.Start(ctx, options...)
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
		Title:          "app:login start",
		Transform:      transform,
	})
}
