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

var matrixBridgesAuthListFlows = cli.Command{
	Name:    "list-flows",
	Usage:   "Get the available login flows.",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[string]{
			Name:      "bridge-id",
			Required:  true,
			PathParam: "bridgeID",
		},
	},
	Action:          handleMatrixBridgesAuthListFlows,
	HideHelpCommand: true,
}

var matrixBridgesAuthListLogins = cli.Command{
	Name:    "list-logins",
	Usage:   "Get the login IDs of the current user.",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[string]{
			Name:      "bridge-id",
			Required:  true,
			PathParam: "bridgeID",
		},
	},
	Action:          handleMatrixBridgesAuthListLogins,
	HideHelpCommand: true,
}

var matrixBridgesAuthLogout = cli.Command{
	Name:    "logout",
	Usage:   "Log out of an existing login.",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[string]{
			Name:      "bridge-id",
			Required:  true,
			PathParam: "bridgeID",
		},
		&requestflag.Flag[string]{
			Name:      "login-id",
			Usage:     "The unique ID of a login. Defined by the network connector.",
			Required:  true,
			PathParam: "loginID",
		},
	},
	Action:          handleMatrixBridgesAuthLogout,
	HideHelpCommand: true,
}

var matrixBridgesAuthStartLogin = cli.Command{
	Name:    "start-login",
	Usage:   "This endpoint starts a new login process, which is used to log into the bridge.",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[string]{
			Name:      "bridge-id",
			Required:  true,
			PathParam: "bridgeID",
		},
		&requestflag.Flag[string]{
			Name:      "flow-id",
			Required:  true,
			PathParam: "flowID",
		},
		&requestflag.Flag[string]{
			Name:      "login-id",
			Usage:     "An existing login ID to re-login as. If this is specified and the user logs into a different account, the provided ID will be logged out.",
			QueryPath: "login_id",
		},
	},
	Action:          handleMatrixBridgesAuthStartLogin,
	HideHelpCommand: true,
}

var matrixBridgesAuthSubmitCookies = cli.Command{
	Name:    "submit-cookies",
	Usage:   "Submit extracted cookies in a login process.",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[string]{
			Name:      "bridge-id",
			Required:  true,
			PathParam: "bridgeID",
		},
		&requestflag.Flag[string]{
			Name:      "login-process-id",
			Required:  true,
			PathParam: "loginProcessID",
		},
		&requestflag.Flag[string]{
			Name:      "step-id",
			Required:  true,
			PathParam: "stepID",
		},
		&requestflag.Flag[map[string]any]{
			Name:     "body",
			Required: true,
			BodyRoot: true,
		},
	},
	Action:          handleMatrixBridgesAuthSubmitCookies,
	HideHelpCommand: true,
}

var matrixBridgesAuthSubmitUserInput = cli.Command{
	Name:    "submit-user-input",
	Usage:   "Submit user input in a login process.",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[string]{
			Name:      "bridge-id",
			Required:  true,
			PathParam: "bridgeID",
		},
		&requestflag.Flag[string]{
			Name:      "login-process-id",
			Required:  true,
			PathParam: "loginProcessID",
		},
		&requestflag.Flag[string]{
			Name:      "step-id",
			Required:  true,
			PathParam: "stepID",
		},
		&requestflag.Flag[map[string]any]{
			Name:     "body",
			Required: true,
			BodyRoot: true,
		},
	},
	Action:          handleMatrixBridgesAuthSubmitUserInput,
	HideHelpCommand: true,
}

var matrixBridgesAuthWaitForStep = cli.Command{
	Name:    "wait-for-step",
	Usage:   "Wait for the next step after displaying data to the user.",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[string]{
			Name:      "bridge-id",
			Required:  true,
			PathParam: "bridgeID",
		},
		&requestflag.Flag[string]{
			Name:      "login-process-id",
			Required:  true,
			PathParam: "loginProcessID",
		},
		&requestflag.Flag[string]{
			Name:      "step-id",
			Required:  true,
			PathParam: "stepID",
		},
	},
	Action:          handleMatrixBridgesAuthWaitForStep,
	HideHelpCommand: true,
}

var matrixBridgesAuthWhoami = cli.Command{
	Name:    "whoami",
	Usage:   "Get all info that is useful for presenting this bridge in a manager interface.",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[string]{
			Name:      "bridge-id",
			Required:  true,
			PathParam: "bridgeID",
		},
	},
	Action:          handleMatrixBridgesAuthWhoami,
	HideHelpCommand: true,
}

func handleMatrixBridgesAuthListFlows(ctx context.Context, cmd *cli.Command) error {
	client := beeperdesktopapi.NewClient(getDefaultRequestOptions(cmd)...)
	unusedArgs := cmd.Args().Slice()
	if !cmd.IsSet("bridge-id") && len(unusedArgs) > 0 {
		cmd.Set("bridge-id", unusedArgs[0])
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
	_, err = client.Matrix.Bridges.Auth.ListFlows(ctx, cmd.Value("bridge-id").(string), options...)
	if err != nil {
		return err
	}

	obj := gjson.ParseBytes(res)
	format := "json"
	explicitFormat := cmd.Root().IsSet("format")
	if explicitFormat {
		format = cmd.Root().String("format")
	}
	transform := cmd.Root().String("transform")
	return ShowJSON(obj, ShowJSONOpts{
		ExplicitFormat: explicitFormat,
		Format:         format,
		RawOutput:      cmd.Root().Bool("raw-output"),
		Title:          "matrix:bridges:auth list-flows",
		Transform:      transform,
	})
}

func handleMatrixBridgesAuthListLogins(ctx context.Context, cmd *cli.Command) error {
	client := beeperdesktopapi.NewClient(getDefaultRequestOptions(cmd)...)
	unusedArgs := cmd.Args().Slice()
	if !cmd.IsSet("bridge-id") && len(unusedArgs) > 0 {
		cmd.Set("bridge-id", unusedArgs[0])
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
	_, err = client.Matrix.Bridges.Auth.ListLogins(ctx, cmd.Value("bridge-id").(string), options...)
	if err != nil {
		return err
	}

	obj := gjson.ParseBytes(res)
	format := "json"
	explicitFormat := cmd.Root().IsSet("format")
	if explicitFormat {
		format = cmd.Root().String("format")
	}
	transform := cmd.Root().String("transform")
	return ShowJSON(obj, ShowJSONOpts{
		ExplicitFormat: explicitFormat,
		Format:         format,
		RawOutput:      cmd.Root().Bool("raw-output"),
		Title:          "matrix:bridges:auth list-logins",
		Transform:      transform,
	})
}

func handleMatrixBridgesAuthLogout(ctx context.Context, cmd *cli.Command) error {
	client := beeperdesktopapi.NewClient(getDefaultRequestOptions(cmd)...)
	unusedArgs := cmd.Args().Slice()
	if !cmd.IsSet("login-id") && len(unusedArgs) > 0 {
		cmd.Set("login-id", unusedArgs[0])
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

	params := beeperdesktopapi.MatrixBridgeAuthLogoutParams{
		BridgeID: cmd.Value("bridge-id").(string),
	}

	var res []byte
	options = append(options, option.WithResponseBodyInto(&res))
	_, err = client.Matrix.Bridges.Auth.Logout(
		ctx,
		cmd.Value("login-id").(string),
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
		Title:          "matrix:bridges:auth logout",
		Transform:      transform,
	})
}

func handleMatrixBridgesAuthStartLogin(ctx context.Context, cmd *cli.Command) error {
	client := beeperdesktopapi.NewClient(getDefaultRequestOptions(cmd)...)
	unusedArgs := cmd.Args().Slice()
	if !cmd.IsSet("flow-id") && len(unusedArgs) > 0 {
		cmd.Set("flow-id", unusedArgs[0])
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

	params := beeperdesktopapi.MatrixBridgeAuthStartLoginParams{
		BridgeID: cmd.Value("bridge-id").(string),
	}

	var res []byte
	options = append(options, option.WithResponseBodyInto(&res))
	_, err = client.Matrix.Bridges.Auth.StartLogin(
		ctx,
		cmd.Value("flow-id").(string),
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
		Title:          "matrix:bridges:auth start-login",
		Transform:      transform,
	})
}

func handleMatrixBridgesAuthSubmitCookies(ctx context.Context, cmd *cli.Command) error {
	client := beeperdesktopapi.NewClient(getDefaultRequestOptions(cmd)...)
	unusedArgs := cmd.Args().Slice()
	if !cmd.IsSet("step-id") && len(unusedArgs) > 0 {
		cmd.Set("step-id", unusedArgs[0])
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

	params := beeperdesktopapi.MatrixBridgeAuthSubmitCookiesParams{
		BridgeID:       cmd.Value("bridge-id").(string),
		LoginProcessID: cmd.Value("login-process-id").(string),
	}

	var res []byte
	options = append(options, option.WithResponseBodyInto(&res))
	_, err = client.Matrix.Bridges.Auth.SubmitCookies(
		ctx,
		cmd.Value("step-id").(string),
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
		Title:          "matrix:bridges:auth submit-cookies",
		Transform:      transform,
	})
}

func handleMatrixBridgesAuthSubmitUserInput(ctx context.Context, cmd *cli.Command) error {
	client := beeperdesktopapi.NewClient(getDefaultRequestOptions(cmd)...)
	unusedArgs := cmd.Args().Slice()
	if !cmd.IsSet("step-id") && len(unusedArgs) > 0 {
		cmd.Set("step-id", unusedArgs[0])
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

	params := beeperdesktopapi.MatrixBridgeAuthSubmitUserInputParams{
		BridgeID:       cmd.Value("bridge-id").(string),
		LoginProcessID: cmd.Value("login-process-id").(string),
	}

	var res []byte
	options = append(options, option.WithResponseBodyInto(&res))
	_, err = client.Matrix.Bridges.Auth.SubmitUserInput(
		ctx,
		cmd.Value("step-id").(string),
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
		Title:          "matrix:bridges:auth submit-user-input",
		Transform:      transform,
	})
}

func handleMatrixBridgesAuthWaitForStep(ctx context.Context, cmd *cli.Command) error {
	client := beeperdesktopapi.NewClient(getDefaultRequestOptions(cmd)...)
	unusedArgs := cmd.Args().Slice()
	if !cmd.IsSet("step-id") && len(unusedArgs) > 0 {
		cmd.Set("step-id", unusedArgs[0])
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

	params := beeperdesktopapi.MatrixBridgeAuthWaitForStepParams{
		BridgeID:       cmd.Value("bridge-id").(string),
		LoginProcessID: cmd.Value("login-process-id").(string),
	}

	var res []byte
	options = append(options, option.WithResponseBodyInto(&res))
	_, err = client.Matrix.Bridges.Auth.WaitForStep(
		ctx,
		cmd.Value("step-id").(string),
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
		Title:          "matrix:bridges:auth wait-for-step",
		Transform:      transform,
	})
}

func handleMatrixBridgesAuthWhoami(ctx context.Context, cmd *cli.Command) error {
	client := beeperdesktopapi.NewClient(getDefaultRequestOptions(cmd)...)
	unusedArgs := cmd.Args().Slice()
	if !cmd.IsSet("bridge-id") && len(unusedArgs) > 0 {
		cmd.Set("bridge-id", unusedArgs[0])
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
	_, err = client.Matrix.Bridges.Auth.Whoami(ctx, cmd.Value("bridge-id").(string), options...)
	if err != nil {
		return err
	}

	obj := gjson.ParseBytes(res)
	format := "json"
	explicitFormat := cmd.Root().IsSet("format")
	if explicitFormat {
		format = cmd.Root().String("format")
	}
	transform := cmd.Root().String("transform")
	return ShowJSON(obj, ShowJSONOpts{
		ExplicitFormat: explicitFormat,
		Format:         format,
		RawOutput:      cmd.Root().Bool("raw-output"),
		Title:          "matrix:bridges:auth whoami",
		Transform:      transform,
	})
}
