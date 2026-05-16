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

var matrixRoomsEventsRetrieve = cli.Command{
	Name:    "retrieve",
	Usage:   "Get a single event based on `roomId/eventId`. You must have permission to\nretrieve this event e.g. by being a member in the room for this event.",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[string]{
			Name:      "room-id",
			Required:  true,
			PathParam: "roomId",
		},
		&requestflag.Flag[string]{
			Name:      "event-id",
			Required:  true,
			PathParam: "eventId",
		},
	},
	Action:          handleMatrixRoomsEventsRetrieve,
	HideHelpCommand: true,
}

func handleMatrixRoomsEventsRetrieve(ctx context.Context, cmd *cli.Command) error {
	client := beeperdesktopapi.NewClient(getDefaultRequestOptions(cmd)...)
	unusedArgs := cmd.Args().Slice()
	if !cmd.IsSet("event-id") && len(unusedArgs) > 0 {
		cmd.Set("event-id", unusedArgs[0])
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

	params := beeperdesktopapi.MatrixRoomEventGetParams{
		RoomID: cmd.Value("room-id").(string),
	}

	var res []byte
	options = append(options, option.WithResponseBodyInto(&res))
	_, err = client.Matrix.Rooms.Events.Get(
		ctx,
		cmd.Value("event-id").(string),
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
		Title:          "matrix:rooms:events retrieve",
		Transform:      transform,
	})
}
