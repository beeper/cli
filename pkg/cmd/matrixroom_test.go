// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

package cmd

import (
	"testing"

	"github.com/beeper/desktop-api-cli/internal/mocktest"
	"github.com/beeper/desktop-api-cli/internal/requestflag"
)

func TestMatrixRoomsCreate(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"matrix:rooms", "create",
			"--creation-content", "{m.federate: false}",
			"--initial-state", "{content: {}, type: type, state_key: state_key}",
			"--invite", "string",
			"--invite-3pid", "{address: cheeky@monkey.com, id_access_token: abc123_OpaqueString, id_server: matrix.org, medium: email}",
			"--is-direct=true",
			"--name", "The Grand Duke Pub",
			"--power-level-content-override", "{}",
			"--preset", "public_chat",
			"--room-alias-name", "thepub",
			"--room-version", "1",
			"--topic", "All about happy hour",
			"--visibility", "public",
		)
	})

	t.Run("inner flags", func(t *testing.T) {
		// Check that inner flags have been set up correctly
		requestflag.CheckInnerFlags(matrixRoomsCreate)

		// Alternative argument passing style using inner flags
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"matrix:rooms", "create",
			"--creation-content", "{m.federate: false}",
			"--initial-state.content", "{}",
			"--initial-state.type", "type",
			"--initial-state.state-key", "state_key",
			"--invite", "string",
			"--invite-3pid.address", "cheeky@monkey.com",
			"--invite-3pid.id-access-token", "abc123_OpaqueString",
			"--invite-3pid.id-server", "matrix.org",
			"--invite-3pid.medium", "email",
			"--is-direct=true",
			"--name", "The Grand Duke Pub",
			"--power-level-content-override", "{}",
			"--preset", "public_chat",
			"--room-alias-name", "thepub",
			"--room-version", "1",
			"--topic", "All about happy hour",
			"--visibility", "public",
		)
	})

	t.Run("piping data", func(t *testing.T) {
		// Test piping YAML data over stdin
		pipeData := []byte("" +
			"creation_content:\n" +
			"  m.federate: false\n" +
			"initial_state:\n" +
			"  - content: {}\n" +
			"    type: type\n" +
			"    state_key: state_key\n" +
			"invite:\n" +
			"  - string\n" +
			"invite_3pid:\n" +
			"  - address: cheeky@monkey.com\n" +
			"    id_access_token: abc123_OpaqueString\n" +
			"    id_server: matrix.org\n" +
			"    medium: email\n" +
			"is_direct: true\n" +
			"name: The Grand Duke Pub\n" +
			"power_level_content_override: {}\n" +
			"preset: public_chat\n" +
			"room_alias_name: thepub\n" +
			"room_version: '1'\n" +
			"topic: All about happy hour\n" +
			"visibility: public\n")
		mocktest.TestRunMockTestWithPipeAndFlags(
			t, pipeData,
			"--access-token", "string",
			"matrix:rooms", "create",
		)
	})
}

func TestMatrixRoomsJoin(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"matrix:rooms", "join",
			"--room-id-or-alias", "!monkeys:matrix.org",
			"--via", "string",
			"--reason", "Looking for support",
			"--third-party-signed", "{token: random8nonce, mxid: bob, sender: alice, signatures: {example.org: {ed25519:0: some9signature}}}",
		)
	})

	t.Run("inner flags", func(t *testing.T) {
		// Check that inner flags have been set up correctly
		requestflag.CheckInnerFlags(matrixRoomsJoin)

		// Alternative argument passing style using inner flags
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"matrix:rooms", "join",
			"--room-id-or-alias", "!monkeys:matrix.org",
			"--via", "string",
			"--reason", "Looking for support",
			"--third-party-signed.token", "random8nonce",
			"--third-party-signed.mxid", "bob",
			"--third-party-signed.sender", "alice",
			"--third-party-signed.signatures", "{example.org: {ed25519:0: some9signature}}",
		)
	})

	t.Run("piping data", func(t *testing.T) {
		// Test piping YAML data over stdin
		pipeData := []byte("" +
			"reason: Looking for support\n" +
			"third_party_signed:\n" +
			"  token: random8nonce\n" +
			"  mxid: bob\n" +
			"  sender: alice\n" +
			"  signatures:\n" +
			"    example.org:\n" +
			"      ed25519:0: some9signature\n")
		mocktest.TestRunMockTestWithPipeAndFlags(
			t, pipeData,
			"--access-token", "string",
			"matrix:rooms", "join",
			"--room-id-or-alias", "!monkeys:matrix.org",
			"--via", "string",
		)
	})
}

func TestMatrixRoomsLeave(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"matrix:rooms", "leave",
			"--room-id", "!nkl290a:matrix.org",
			"--reason", "Saying farewell - thanks for the support!",
		)
	})

	t.Run("piping data", func(t *testing.T) {
		// Test piping YAML data over stdin
		pipeData := []byte("reason: Saying farewell - thanks for the support!")
		mocktest.TestRunMockTestWithPipeAndFlags(
			t, pipeData,
			"--access-token", "string",
			"matrix:rooms", "leave",
			"--room-id", "!nkl290a:matrix.org",
		)
	})
}
