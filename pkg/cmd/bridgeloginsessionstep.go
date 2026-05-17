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

var bridgesLoginSessionsStepsSubmit = cli.Command{
	Name:    "submit",
	Usage:   "Submit input for the current step of a bridge login session.",
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
		&requestflag.Flag[string]{
			Name:      "step-id",
			Usage:     "Current bridge login session step ID.",
			Required:  true,
			PathParam: "stepID",
		},
		&requestflag.Flag[string]{
			Name:     "type",
			Usage:    `Allowed values: "user_input", "cookies", "display_and_wait".`,
			Required: true,
			BodyPath: "type",
		},
		&requestflag.Flag[map[string]any]{
			Name:     "fields",
			Usage:    "Field values keyed by the field IDs from the current step.",
			BodyPath: "fields",
		},
		&requestflag.Flag[string]{
			Name:     "last-url",
			Usage:    "Last browser URL reached during a cookies step, if available.",
			BodyPath: "lastURL",
		},
		&requestflag.Flag[string]{
			Name:     "source",
			Usage:    "How the step was completed. Omit unless the client needs to distinguish an embedded webview or browser extension.",
			BodyPath: "source",
		},
	},
	Action:          handleBridgesLoginSessionsStepsSubmit,
	HideHelpCommand: true,
}

func handleBridgesLoginSessionsStepsSubmit(ctx context.Context, cmd *cli.Command) error {
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

	params := beeperdesktopapi.BridgeLoginSessionStepSubmitParams{
		BridgeID:       cmd.Value("bridge-id").(string),
		LoginSessionID: cmd.Value("login-session-id").(string),
	}

	var res []byte
	options = append(options, option.WithResponseBodyInto(&res))
	_, err = client.Bridges.LoginSessions.Steps.Submit(
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
		Title:          "bridges:login-sessions:steps submit",
		Transform:      transform,
	})
}
