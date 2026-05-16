// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

package cmd

import (
	"testing"

	"github.com/beeper/desktop-api-cli/internal/mocktest"
)

func TestAppE2eeVerificationSasConfirm(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"app:e2ee:verification:sas", "confirm",
			"--verification-id", "x",
		)
	})
}

func TestAppE2eeVerificationSasStart(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"app:e2ee:verification:sas", "start",
			"--verification-id", "x",
		)
	})
}
