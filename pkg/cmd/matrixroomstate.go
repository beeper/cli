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

var matrixRoomsStateRetrieve = cli.Command{
	Name:    "retrieve",
	Usage:   "Looks up the contents of a state event in a room. If the user is joined to the\nroom then the state is taken from the current state of the room. If the user has\nleft the room then the state is taken from the state of the room when they left.",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[string]{
			Name:      "room-id",
			Required:  true,
			PathParam: "roomId",
		},
		&requestflag.Flag[string]{
			Name:      "event-type",
			Required:  true,
			PathParam: "eventType",
		},
		&requestflag.Flag[string]{
			Name:      "state-key",
			Required:  true,
			PathParam: "stateKey",
		},
		&requestflag.Flag[string]{
			Name:      "format",
			Usage:     "The format to use for the returned data. `content` (the default) will\nreturn only the content of the state event. `event` will return the entire\nevent in the usual format suitable for clients, including fields like event\nID, sender and timestamp.",
			QueryPath: "format",
		},
	},
	Action:          handleMatrixRoomsStateRetrieve,
	HideHelpCommand: true,
}

var matrixRoomsStateList = cli.Command{
	Name:    "list",
	Usage:   "Get the state events for the current state of a room.",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[string]{
			Name:      "room-id",
			Required:  true,
			PathParam: "roomId",
		},
	},
	Action:          handleMatrixRoomsStateList,
	HideHelpCommand: true,
}

func handleMatrixRoomsStateRetrieve(ctx context.Context, cmd *cli.Command) error {
	client := beeperdesktopapi.NewClient(getDefaultRequestOptions(cmd)...)
	unusedArgs := cmd.Args().Slice()
	if !cmd.IsSet("state-key") && len(unusedArgs) > 0 {
		cmd.Set("state-key", unusedArgs[0])
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

	params := beeperdesktopapi.MatrixRoomStateGetParams{
		RoomID:    cmd.Value("room-id").(string),
		EventType: cmd.Value("event-type").(string),
	}

	var res []byte
	options = append(options, option.WithResponseBodyInto(&res))
	_, err = client.Matrix.Rooms.State.Get(
		ctx,
		cmd.Value("state-key").(string),
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
		Title:          "matrix:rooms:state retrieve",
		Transform:      transform,
	})
}

func handleMatrixRoomsStateList(ctx context.Context, cmd *cli.Command) error {
	client := beeperdesktopapi.NewClient(getDefaultRequestOptions(cmd)...)
	unusedArgs := cmd.Args().Slice()
	if !cmd.IsSet("room-id") && len(unusedArgs) > 0 {
		cmd.Set("room-id", unusedArgs[0])
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
	_, err = client.Matrix.Rooms.State.List(ctx, cmd.Value("room-id").(string), options...)
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
		Title:          "matrix:rooms:state list",
		Transform:      transform,
	})
}
