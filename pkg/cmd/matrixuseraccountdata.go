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

var matrixUsersAccountDataRetrieve = cli.Command{
	Name:    "retrieve",
	Usage:   "Get some account data for the client. This config is only visible to the user\nthat set the account data.",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[string]{
			Name:      "user-id",
			Required:  true,
			PathParam: "userId",
		},
		&requestflag.Flag[string]{
			Name:      "type",
			Required:  true,
			PathParam: "type",
		},
	},
	Action:          handleMatrixUsersAccountDataRetrieve,
	HideHelpCommand: true,
}

var matrixUsersAccountDataUpdate = cli.Command{
	Name:    "update",
	Usage:   "Set some account data for the client. This config is only visible to the user\nthat set the account data. The config will be available to clients through the\ntop-level `account_data` field in the homeserver response to\n[/sync](https://spec.matrix.org/v1.18/client-server-api/#get_matrixclientv3sync).",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[string]{
			Name:      "user-id",
			Required:  true,
			PathParam: "userId",
		},
		&requestflag.Flag[string]{
			Name:      "type",
			Required:  true,
			PathParam: "type",
		},
		&requestflag.Flag[any]{
			Name:     "body",
			Required: true,
			BodyRoot: true,
		},
	},
	Action:          handleMatrixUsersAccountDataUpdate,
	HideHelpCommand: true,
}

func handleMatrixUsersAccountDataRetrieve(ctx context.Context, cmd *cli.Command) error {
	client := beeperdesktopapi.NewClient(getDefaultRequestOptions(cmd)...)
	unusedArgs := cmd.Args().Slice()
	if !cmd.IsSet("type") && len(unusedArgs) > 0 {
		cmd.Set("type", unusedArgs[0])
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

	params := beeperdesktopapi.MatrixUserAccountDataGetParams{
		UserID: cmd.Value("user-id").(string),
	}

	var res []byte
	options = append(options, option.WithResponseBodyInto(&res))
	_, err = client.Matrix.Users.AccountData.Get(
		ctx,
		cmd.Value("type").(string),
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
		Title:          "matrix:users:account-data retrieve",
		Transform:      transform,
	})
}

func handleMatrixUsersAccountDataUpdate(ctx context.Context, cmd *cli.Command) error {
	client := beeperdesktopapi.NewClient(getDefaultRequestOptions(cmd)...)
	unusedArgs := cmd.Args().Slice()
	if !cmd.IsSet("type") && len(unusedArgs) > 0 {
		cmd.Set("type", unusedArgs[0])
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

	params := beeperdesktopapi.MatrixUserAccountDataUpdateParams{
		UserID: cmd.Value("user-id").(string),
	}

	var res []byte
	options = append(options, option.WithResponseBodyInto(&res))
	_, err = client.Matrix.Users.AccountData.Update(
		ctx,
		cmd.Value("type").(string),
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
		Title:          "matrix:users:account-data update",
		Transform:      transform,
	})
}
