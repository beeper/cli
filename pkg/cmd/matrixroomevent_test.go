// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

package cmd

import (
	"testing"

	"github.com/beeper/desktop-api-cli/internal/mocktest"
)

func TestMatrixRoomsEventsRetrieve(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"matrix:rooms:events", "retrieve",
			"--room-id", "!636q39766251:matrix.org",
			"--event-id", "$asfDuShaf7Gafaw:matrix.org",
		)
	})
}
