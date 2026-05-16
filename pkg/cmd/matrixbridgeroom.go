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

var matrixBridgesRoomsCreateDm = cli.Command{
	Name:    "create-dm",
	Usage:   "Create a direct chat with a user on the remote network.",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[string]{
			Name:      "bridge-id",
			Required:  true,
			PathParam: "bridgeID",
		},
		&requestflag.Flag[string]{
			Name:      "identifier",
			Required:  true,
			PathParam: "identifier",
		},
		&requestflag.Flag[string]{
			Name:      "login-id",
			Usage:     "An optional explicit login ID to do the action through.",
			QueryPath: "login_id",
		},
	},
	Action:          handleMatrixBridgesRoomsCreateDm,
	HideHelpCommand: true,
}

var matrixBridgesRoomsCreateGroup = requestflag.WithInnerFlags(cli.Command{
	Name:    "create-group",
	Usage:   "Create a group chat on the remote network.",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[string]{
			Name:      "bridge-id",
			Required:  true,
			PathParam: "bridgeID",
		},
		&requestflag.Flag[string]{
			Name:      "group-type",
			Required:  true,
			PathParam: "groupType",
		},
		&requestflag.Flag[string]{
			Name:      "login-id",
			Usage:     "An optional explicit login ID to do the action through.",
			QueryPath: "login_id",
		},
		&requestflag.Flag[map[string]any]{
			Name:     "avatar",
			Usage:    "The `m.room.avatar` event content for the room.",
			BodyPath: "avatar",
		},
		&requestflag.Flag[map[string]any]{
			Name:     "disappear",
			Usage:    "The `com.beeper.disappearing_timer` event content for the room.",
			BodyPath: "disappear",
		},
		&requestflag.Flag[map[string]any]{
			Name:     "name",
			Usage:    "The `m.room.name` event content for the room.",
			BodyPath: "name",
		},
		&requestflag.Flag[any]{
			Name:     "parent",
			BodyPath: "parent",
		},
		&requestflag.Flag[[]string]{
			Name:     "participant",
			Usage:    "The users to add to the group initially.",
			BodyPath: "participants",
		},
		&requestflag.Flag[string]{
			Name:     "room-id",
			Usage:    "An existing Matrix room ID to bridge to.\nThe other parameters must be already in sync with the room state when using this parameter.\n",
			BodyPath: "room_id",
		},
		&requestflag.Flag[map[string]any]{
			Name:     "topic",
			Usage:    "The `m.room.topic` event content for the room.",
			BodyPath: "topic",
		},
		&requestflag.Flag[string]{
			Name:     "type",
			Usage:    "The type of group to create.",
			BodyPath: "type",
		},
		&requestflag.Flag[string]{
			Name:     "username",
			Usage:    "The public username for the created group.",
			BodyPath: "username",
		},
	},
	Action:          handleMatrixBridgesRoomsCreateGroup,
	HideHelpCommand: true,
}, map[string][]requestflag.HasOuterFlag{
	"avatar": {
		&requestflag.InnerFlag[string]{
			Name:       "avatar.url",
			InnerField: "url",
		},
	},
	"disappear": {
		&requestflag.InnerFlag[float64]{
			Name:       "disappear.timer",
			InnerField: "timer",
		},
		&requestflag.InnerFlag[string]{
			Name:       "disappear.type",
			InnerField: "type",
		},
	},
	"name": {
		&requestflag.InnerFlag[string]{
			Name:       "name.name",
			InnerField: "name",
		},
	},
	"topic": {
		&requestflag.InnerFlag[string]{
			Name:       "topic.topic",
			InnerField: "topic",
		},
	},
})

func handleMatrixBridgesRoomsCreateDm(ctx context.Context, cmd *cli.Command) error {
	client := beeperdesktopapi.NewClient(getDefaultRequestOptions(cmd)...)
	unusedArgs := cmd.Args().Slice()
	if !cmd.IsSet("identifier") && len(unusedArgs) > 0 {
		cmd.Set("identifier", unusedArgs[0])
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

	params := beeperdesktopapi.MatrixBridgeRoomNewDmParams{
		BridgeID: cmd.Value("bridge-id").(string),
	}

	var res []byte
	options = append(options, option.WithResponseBodyInto(&res))
	_, err = client.Matrix.Bridges.Rooms.NewDm(
		ctx,
		cmd.Value("identifier").(string),
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
		Title:          "matrix:bridges:rooms create-dm",
		Transform:      transform,
	})
}

func handleMatrixBridgesRoomsCreateGroup(ctx context.Context, cmd *cli.Command) error {
	client := beeperdesktopapi.NewClient(getDefaultRequestOptions(cmd)...)
	unusedArgs := cmd.Args().Slice()
	if !cmd.IsSet("group-type") && len(unusedArgs) > 0 {
		cmd.Set("group-type", unusedArgs[0])
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

	params := beeperdesktopapi.MatrixBridgeRoomNewGroupParams{
		BridgeID: cmd.Value("bridge-id").(string),
	}

	var res []byte
	options = append(options, option.WithResponseBodyInto(&res))
	_, err = client.Matrix.Bridges.Rooms.NewGroup(
		ctx,
		cmd.Value("group-type").(string),
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
		Title:          "matrix:bridges:rooms create-group",
		Transform:      transform,
	})
}
