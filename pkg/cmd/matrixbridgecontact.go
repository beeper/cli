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

var matrixBridgesContactsList = cli.Command{
	Name:    "list",
	Usage:   "Get a list of contacts.",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[string]{
			Name:      "bridge-id",
			Required:  true,
			PathParam: "bridgeID",
		},
		&requestflag.Flag[string]{
			Name:      "login-id",
			Usage:     "An optional explicit login ID to do the action through.",
			QueryPath: "login_id",
		},
	},
	Action:          handleMatrixBridgesContactsList,
	HideHelpCommand: true,
}

func handleMatrixBridgesContactsList(ctx context.Context, cmd *cli.Command) error {
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

	params := beeperdesktopapi.MatrixBridgeContactListParams{}

	var res []byte
	options = append(options, option.WithResponseBodyInto(&res))
	_, err = client.Matrix.Bridges.Contacts.List(
		ctx,
		cmd.Value("bridge-id").(string),
		params,
		options...,
	)
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
		Title:          "matrix:bridges:contacts list",
		Transform:      transform,
	})
}
