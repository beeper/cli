// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

package cmd

import (
	"testing"

	"github.com/beeper/desktop-api-cli/internal/mocktest"
)

func TestMatrixRoomsStateRetrieve(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"matrix:rooms:state", "retrieve",
			"--room-id", "!636q39766251:example.com",
			"--event-type", "m.room.name",
			"--state-key", "state_key",
			"--format", "content",
		)
	})
}

func TestMatrixRoomsStateList(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"matrix:rooms:state", "list",
			"--room-id", "!636q39766251:example.com",
		)
	})
}
