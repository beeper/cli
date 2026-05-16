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

var matrixRoomsCreate = requestflag.WithInnerFlags(cli.Command{
	Name:    "create",
	Usage:   "Create a new room with various configuration options.",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[any]{
			Name:     "creation-content",
			Usage:    "Extra keys, such as `m.federate`, to be added to the content\nof the [`m.room.create`](https://spec.matrix.org/v1.18/client-server-api/#mroomcreate) event.\n\nThe server will overwrite the following\nkeys: `creator`, `room_version`. Future versions of the specification\nmay allow the server to overwrite other keys.\n\nWhen using the `trusted_private_chat` preset, the server SHOULD combine\n`additional_creators` specified here and the `invite` array into the\neventual `m.room.create` event's `additional_creators`, deduplicating\nbetween the two parameters.",
			BodyPath: "creation_content",
		},
		&requestflag.Flag[[]map[string]any]{
			Name:     "initial-state",
			Usage:    "A list of state events to set in the new room. This allows\nthe user to override the default state events set in the new\nroom. The expected format of the state events are an object\nwith type, state_key and content keys set.\n\nTakes precedence over events set by `preset`, but gets\noverridden by `name` and `topic` keys.",
			BodyPath: "initial_state",
		},
		&requestflag.Flag[[]string]{
			Name:     "invite",
			Usage:    "A list of user IDs to invite to the room. This will tell the\nserver to invite everyone in the list to the newly created room.",
			BodyPath: "invite",
		},
		&requestflag.Flag[[]map[string]any]{
			Name:     "invite-3pid",
			Usage:    "A list of objects representing third-party IDs to invite into\nthe room.",
			BodyPath: "invite_3pid",
		},
		&requestflag.Flag[bool]{
			Name:     "is-direct",
			Usage:    "This flag makes the server set the `is_direct` flag on the\n`m.room.member` events sent to the users in `invite` and\n`invite_3pid`. See [Direct Messaging](https://spec.matrix.org/v1.18/client-server-api/#direct-messaging) for more information.",
			BodyPath: "is_direct",
		},
		&requestflag.Flag[string]{
			Name:     "name",
			Usage:    "If this is included, an [`m.room.name`](https://spec.matrix.org/v1.18/client-server-api/#mroomname) event\nwill be sent into the room to indicate the name for the room.\nThis overwrites any [`m.room.name`](https://spec.matrix.org/v1.18/client-server-api/#mroomname)\nevent in `initial_state`.",
			BodyPath: "name",
		},
		&requestflag.Flag[any]{
			Name:     "power-level-content-override",
			Usage:    "The power level content to override in the default power level\nevent. This object is applied on top of the generated\n[`m.room.power_levels`](https://spec.matrix.org/v1.18/client-server-api/#mroompower_levels)\nevent content prior to it being sent to the room. Defaults to\noverriding nothing.",
			BodyPath: "power_level_content_override",
		},
		&requestflag.Flag[string]{
			Name:     "preset",
			Usage:    "Convenience parameter for setting various default state events\nbased on a preset.\n\nIf unspecified, the server should use the `visibility` to determine\nwhich preset to use. A visibility of `public` equates to a preset of\n`public_chat` and `private` visibility equates to a preset of\n`private_chat`.",
			BodyPath: "preset",
		},
		&requestflag.Flag[string]{
			Name:     "room-alias-name",
			Usage:    "The desired room alias **local part**. If this is included, a\nroom alias will be created and mapped to the newly created\nroom. The alias will belong on the *same* homeserver which\ncreated the room. For example, if this was set to \"foo\" and\nsent to the homeserver \"example.com\" the complete room alias\nwould be `#foo:example.com`.\n\nThe complete room alias will become the canonical alias for\nthe room and an `m.room.canonical_alias` event will be sent\ninto the room.",
			BodyPath: "room_alias_name",
		},
		&requestflag.Flag[string]{
			Name:     "room-version",
			Usage:    "The room version to set for the room. If not provided, the homeserver is\nto use its configured default. If provided, the homeserver will return a\n400 error with the errcode `M_UNSUPPORTED_ROOM_VERSION` if it does not\nsupport the room version.",
			BodyPath: "room_version",
		},
		&requestflag.Flag[string]{
			Name:     "topic",
			Usage:    "If this is included, an [`m.room.topic`](https://spec.matrix.org/v1.18/client-server-api/#mroomtopic)\nevent with a `text/plain` mimetype will be sent into the room\nto indicate the topic for the room. This overwrites any\n[`m.room.topic`](https://spec.matrix.org/v1.18/client-server-api/#mroomtopic) event in `initial_state`.",
			BodyPath: "topic",
		},
		&requestflag.Flag[string]{
			Name:     "visibility",
			Usage:    "The room's visibility in the server's\n[published room directory](https://spec.matrix.org/v1.18/client-server-api#published-room-directory).\nDefaults to `private`.",
			BodyPath: "visibility",
		},
	},
	Action:          handleMatrixRoomsCreate,
	HideHelpCommand: true,
}, map[string][]requestflag.HasOuterFlag{
	"initial-state": {
		&requestflag.InnerFlag[any]{
			Name:       "initial-state.content",
			Usage:      "The content of the event.",
			InnerField: "content",
		},
		&requestflag.InnerFlag[string]{
			Name:       "initial-state.type",
			Usage:      "The type of event to send.",
			InnerField: "type",
		},
		&requestflag.InnerFlag[string]{
			Name:       "initial-state.state-key",
			Usage:      "The state_key of the state event. Defaults to an empty string.",
			InnerField: "state_key",
		},
	},
	"invite-3pid": {
		&requestflag.InnerFlag[string]{
			Name:       "invite-3pid.address",
			Usage:      "The invitee's third-party identifier.",
			InnerField: "address",
		},
		&requestflag.InnerFlag[string]{
			Name:       "invite-3pid.id-access-token",
			Usage:      "An access token previously registered with the identity server. Servers\ncan treat this as optional to distinguish between r0.5-compatible clients\nand this specification version.",
			InnerField: "id_access_token",
		},
		&requestflag.InnerFlag[string]{
			Name:       "invite-3pid.id-server",
			Usage:      "The hostname+port of the identity server which should be used for third-party identifier lookups.",
			InnerField: "id_server",
		},
		&requestflag.InnerFlag[string]{
			Name:       "invite-3pid.medium",
			Usage:      "The kind of address being passed in the address field, for example `email`\n(see [the list of recognised values](https://spec.matrix.org/v1.18/appendices/#3pid-types)).",
			InnerField: "medium",
		},
	},
})

var matrixRoomsJoin = requestflag.WithInnerFlags(cli.Command{
	Name:    "join",
	Usage:   "_Note that this API takes either a room ID or alias, unlike_\n`/rooms/{roomId}/join`.",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[string]{
			Name:      "room-id-or-alias",
			Required:  true,
			PathParam: "roomIdOrAlias",
		},
		&requestflag.Flag[[]string]{
			Name:      "via",
			Usage:     "The servers to attempt to join the room through. One of the servers\nmust be participating in the room.",
			QueryPath: "via",
		},
		&requestflag.Flag[string]{
			Name:     "reason",
			Usage:    "Optional reason to be included as the `reason` on the subsequent\nmembership event.",
			BodyPath: "reason",
		},
		&requestflag.Flag[map[string]any]{
			Name:     "third-party-signed",
			Usage:    "A signature of an `m.third_party_invite` token to prove that this user\nowns a third-party identity which has been invited to the room.",
			BodyPath: "third_party_signed",
		},
	},
	Action:          handleMatrixRoomsJoin,
	HideHelpCommand: true,
}, map[string][]requestflag.HasOuterFlag{
	"third-party-signed": {
		&requestflag.InnerFlag[string]{
			Name:       "third-party-signed.token",
			Usage:      "The state key of the m.third_party_invite event.",
			InnerField: "token",
		},
		&requestflag.InnerFlag[string]{
			Name:       "third-party-signed.mxid",
			Usage:      "The Matrix ID of the invitee.",
			InnerField: "mxid",
		},
		&requestflag.InnerFlag[string]{
			Name:       "third-party-signed.sender",
			Usage:      "The Matrix ID of the user who issued the invite.",
			InnerField: "sender",
		},
		&requestflag.InnerFlag[map[string]any]{
			Name:       "third-party-signed.signatures",
			Usage:      "A signatures object containing a signature of the entire signed object.",
			InnerField: "signatures",
		},
	},
})

var matrixRoomsLeave = cli.Command{
	Name:    "leave",
	Usage:   "This API stops a user participating in a particular room.",
	Suggest: true,
	Flags: []cli.Flag{
		&requestflag.Flag[string]{
			Name:      "room-id",
			Required:  true,
			PathParam: "roomId",
		},
		&requestflag.Flag[string]{
			Name:     "reason",
			Usage:    "Optional reason to be included as the `reason` on the subsequent\nmembership event.",
			BodyPath: "reason",
		},
	},
	Action:          handleMatrixRoomsLeave,
	HideHelpCommand: true,
}

func handleMatrixRoomsCreate(ctx context.Context, cmd *cli.Command) error {
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

	params := beeperdesktopapi.MatrixRoomNewParams{}

	var res []byte
	options = append(options, option.WithResponseBodyInto(&res))
	_, err = client.Matrix.Rooms.New(ctx, params, options...)
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
		Title:          "matrix:rooms create",
		Transform:      transform,
	})
}

func handleMatrixRoomsJoin(ctx context.Context, cmd *cli.Command) error {
	client := beeperdesktopapi.NewClient(getDefaultRequestOptions(cmd)...)
	unusedArgs := cmd.Args().Slice()
	if !cmd.IsSet("room-id-or-alias") && len(unusedArgs) > 0 {
		cmd.Set("room-id-or-alias", unusedArgs[0])
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

	params := beeperdesktopapi.MatrixRoomJoinParams{}

	var res []byte
	options = append(options, option.WithResponseBodyInto(&res))
	_, err = client.Matrix.Rooms.Join(
		ctx,
		cmd.Value("room-id-or-alias").(string),
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
		Title:          "matrix:rooms join",
		Transform:      transform,
	})
}

func handleMatrixRoomsLeave(ctx context.Context, cmd *cli.Command) error {
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
		ApplicationJSON,
		false,
	)
	if err != nil {
		return err
	}

	params := beeperdesktopapi.MatrixRoomLeaveParams{}

	var res []byte
	options = append(options, option.WithResponseBodyInto(&res))
	_, err = client.Matrix.Rooms.Leave(
		ctx,
		cmd.Value("room-id").(string),
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
		Title:          "matrix:rooms leave",
		Transform:      transform,
	})
}
