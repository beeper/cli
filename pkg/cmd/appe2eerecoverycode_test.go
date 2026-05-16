// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

package cmd

import (
	"testing"

	"github.com/beeper/desktop-api-cli/internal/mocktest"
)

func TestAppE2eeRecoveryCodeMarkBackedUp(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"app:e2ee:recovery-code", "mark-backed-up",
		)
	})
}

func TestAppE2eeRecoveryCodeVerify(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"app:e2ee:recovery-code", "verify",
			"--recovery-code", "x",
		)
	})

	t.Run("piping data", func(t *testing.T) {
		// Test piping YAML data over stdin
		pipeData := []byte("recoveryCode: x")
		mocktest.TestRunMockTestWithPipeAndFlags(
			t, pipeData,
			"--access-token", "string",
			"app:e2ee:recovery-code", "verify",
		)
	})
}
