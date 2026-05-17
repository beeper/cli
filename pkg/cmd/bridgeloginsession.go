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

var bridgesLoginSessionsCreate = cli.Command{
	Name:    "create",
	Usage:   "Start a temporary bridge login session to connect a new chat account or\nreconnect an existing bridge login. Omit loginID and accountID to connect a new\naccount.",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[string]{
			Name:      "bridge-id",
			Usage:     "Bridge ID.",
			Required:  true,
			PathParam: "bridgeID",
		},
		&requestflag.Flag[string]{
			Name:     "account-id",
			Usage:    "Existing chat account ID to reconnect. Omit to connect a new account.",
			BodyPath: "accountID",
		},
		&requestflag.Flag[string]{
			Name:     "flow-id",
			Usage:    "Optional flow ID returned by the list login flows endpoint. If omitted, Beeper chooses the default flow.",
			BodyPath: "flowID",
		},
		&requestflag.Flag[string]{
			Name:     "login-id",
			Usage:    "Existing bridge login ID to reconnect. Omit to connect a new account.",
			BodyPath: "loginID",
		},
	},
	Action:          handleBridgesLoginSessionsCreate,
	HideHelpCommand: true,
}

var bridgesLoginSessionsRetrieve = cli.Command{
	Name:    "retrieve",
	Usage:   "Get the current state of a temporary bridge login session.",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[string]{
			Name:      "bridge-id",
			Usage:     "Bridge ID.",
			Required:  true,
			PathParam: "bridgeID",
		},
		&requestflag.Flag[string]{
			Name:      "login-session-id",
			Usage:     "Temporary bridge login session ID.",
			Required:  true,
			PathParam: "loginSessionID",
		},
	},
	Action:          handleBridgesLoginSessionsRetrieve,
	HideHelpCommand: true,
}

var bridgesLoginSessionsCancel = cli.Command{
	Name:    "cancel",
	Usage:   "Cancel a temporary bridge login session.",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[string]{
			Name:      "bridge-id",
			Usage:     "Bridge ID.",
			Required:  true,
			PathParam: "bridgeID",
		},
		&requestflag.Flag[string]{
			Name:      "login-session-id",
			Usage:     "Temporary bridge login session ID.",
			Required:  true,
			PathParam: "loginSessionID",
		},
	},
	Action:          handleBridgesLoginSessionsCancel,
	HideHelpCommand: true,
}

func handleBridgesLoginSessionsCreate(ctx context.Context, cmd *cli.Command) error {
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
		ApplicationJSON,
		false,
	)
	if err != nil {
		return err
	}

	params := beeperdesktopapi.BridgeLoginSessionNewParams{}

	var res []byte
	options = append(options, option.WithResponseBodyInto(&res))
	_, err = client.Bridges.LoginSessions.New(
		ctx,
		cmd.Value("bridge-id").(string),
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
		Title:          "bridges:login-sessions create",
		Transform:      transform,
	})
}

func handleBridgesLoginSessionsRetrieve(ctx context.Context, cmd *cli.Command) error {
	client := beeperdesktopapi.NewClient(getDefaultRequestOptions(cmd)...)
	unusedArgs := cmd.Args().Slice()
	if !cmd.IsSet("login-session-id") && len(unusedArgs) > 0 {
		cmd.Set("login-session-id", unusedArgs[0])
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

	params := beeperdesktopapi.BridgeLoginSessionGetParams{
		BridgeID: cmd.Value("bridge-id").(string),
	}

	var res []byte
	options = append(options, option.WithResponseBodyInto(&res))
	_, err = client.Bridges.LoginSessions.Get(
		ctx,
		cmd.Value("login-session-id").(string),
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
		Title:          "bridges:login-sessions retrieve",
		Transform:      transform,
	})
}

func handleBridgesLoginSessionsCancel(ctx context.Context, cmd *cli.Command) error {
	client := beeperdesktopapi.NewClient(getDefaultRequestOptions(cmd)...)
	unusedArgs := cmd.Args().Slice()
	if !cmd.IsSet("login-session-id") && len(unusedArgs) > 0 {
		cmd.Set("login-session-id", unusedArgs[0])
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

	params := beeperdesktopapi.BridgeLoginSessionCancelParams{
		BridgeID: cmd.Value("bridge-id").(string),
	}

	var res []byte
	options = append(options, option.WithResponseBodyInto(&res))
	_, err = client.Bridges.LoginSessions.Cancel(
		ctx,
		cmd.Value("login-session-id").(string),
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
		Title:          "bridges:login-sessions cancel",
		Transform:      transform,
	})
}
