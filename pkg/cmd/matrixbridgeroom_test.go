// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

package cmd

import (
	"testing"

	"github.com/beeper/desktop-api-cli/internal/mocktest"
	"github.com/beeper/desktop-api-cli/internal/requestflag"
)

func TestMatrixBridgesRoomsCreateDm(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"matrix:bridges:rooms", "create-dm",
			"--bridge-id", "bridgeID",
			"--identifier", "identifier",
			"--login-id", "bcc68892-b180-414f-9516-b4aadf7d0496",
		)
	})
}

func TestMatrixBridgesRoomsCreateGroup(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"matrix:bridges:rooms", "create-group",
			"--bridge-id", "bridgeID",
			"--group-type", "groupType",
			"--login-id", "bcc68892-b180-414f-9516-b4aadf7d0496",
			"--avatar", "{url: url}",
			"--disappear", "{timer: 0, type: type}",
			"--name", "{name: name}",
			"--parent", "{}",
			"--participant", "string",
			"--room-id", "room_id",
			"--topic", "{topic: topic}",
			"--type", "channel",
			"--username", "username",
		)
	})

	t.Run("inner flags", func(t *testing.T) {
		// Check that inner flags have been set up correctly
		requestflag.CheckInnerFlags(matrixBridgesRoomsCreateGroup)

		// Alternative argument passing style using inner flags
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"matrix:bridges:rooms", "create-group",
			"--bridge-id", "bridgeID",
			"--group-type", "groupType",
			"--login-id", "bcc68892-b180-414f-9516-b4aadf7d0496",
			"--avatar.url", "url",
			"--disappear.timer", "0",
			"--disappear.type", "type",
			"--name.name", "name",
			"--parent", "{}",
			"--participant", "string",
			"--room-id", "room_id",
			"--topic.topic", "topic",
			"--type", "channel",
			"--username", "username",
		)
	})

	t.Run("piping data", func(t *testing.T) {
		// Test piping YAML data over stdin
		pipeData := []byte("" +
			"avatar:\n" +
			"  url: url\n" +
			"disappear:\n" +
			"  timer: 0\n" +
			"  type: type\n" +
			"name:\n" +
			"  name: name\n" +
			"parent: {}\n" +
			"participants:\n" +
			"  - string\n" +
			"room_id: room_id\n" +
			"topic:\n" +
			"  topic: topic\n" +
			"type: channel\n" +
			"username: username\n")
		mocktest.TestRunMockTestWithPipeAndFlags(
			t, pipeData,
			"--access-token", "string",
			"matrix:bridges:rooms", "create-group",
			"--bridge-id", "bridgeID",
			"--group-type", "groupType",
			"--login-id", "bcc68892-b180-414f-9516-b4aadf7d0496",
		)
	})
}
