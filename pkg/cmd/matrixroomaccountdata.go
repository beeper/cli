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

var matrixRoomsAccountDataRetrieve = cli.Command{
	Name:    "retrieve",
	Usage:   "Get some account data for the client on a given room. This config is only\nvisible to the user that set the account data.",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[string]{
			Name:      "user-id",
			Required:  true,
			PathParam: "userId",
		},
		&requestflag.Flag[string]{
			Name:      "room-id",
			Required:  true,
			PathParam: "roomId",
		},
		&requestflag.Flag[string]{
			Name:      "type",
			Required:  true,
			PathParam: "type",
		},
	},
	Action:          handleMatrixRoomsAccountDataRetrieve,
	HideHelpCommand: true,
}

var matrixRoomsAccountDataUpdate = cli.Command{
	Name:    "update",
	Usage:   "Set some account data for the client on a given room. This config is only\nvisible to the user that set the account data. The config will be delivered to\nclients in the per-room entries via\n[/sync](https://spec.matrix.org/v1.18/client-server-api/#get_matrixclientv3sync).",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[string]{
			Name:      "user-id",
			Required:  true,
			PathParam: "userId",
		},
		&requestflag.Flag[string]{
			Name:      "room-id",
			Required:  true,
			PathParam: "roomId",
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
	Action:          handleMatrixRoomsAccountDataUpdate,
	HideHelpCommand: true,
}

func handleMatrixRoomsAccountDataRetrieve(ctx context.Context, cmd *cli.Command) error {
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

	params := beeperdesktopapi.MatrixRoomAccountDataGetParams{
		UserID: cmd.Value("user-id").(string),
		RoomID: cmd.Value("room-id").(string),
	}

	var res []byte
	options = append(options, option.WithResponseBodyInto(&res))
	_, err = client.Matrix.Rooms.AccountData.Get(
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
		Title:          "matrix:rooms:account-data retrieve",
		Transform:      transform,
	})
}

func handleMatrixRoomsAccountDataUpdate(ctx context.Context, cmd *cli.Command) error {
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

	params := beeperdesktopapi.MatrixRoomAccountDataUpdateParams{
		UserID: cmd.Value("user-id").(string),
		RoomID: cmd.Value("room-id").(string),
	}

	var res []byte
	options = append(options, option.WithResponseBodyInto(&res))
	_, err = client.Matrix.Rooms.AccountData.Update(
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
		Title:          "matrix:rooms:account-data update",
		Transform:      transform,
	})
}
