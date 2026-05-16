// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

package cmd

import (
	"testing"

	"github.com/beeper/desktop-api-cli/internal/mocktest"
)

func TestAppE2eeVerificationCreate(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"app:e2ee:verification", "create",
			"--user-id", "userID",
		)
	})

	t.Run("piping data", func(t *testing.T) {
		// Test piping YAML data over stdin
		pipeData := []byte("userID: userID")
		mocktest.TestRunMockTestWithPipeAndFlags(
			t, pipeData,
			"--access-token", "string",
			"app:e2ee:verification", "create",
		)
	})
}

func TestAppE2eeVerificationAccept(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"app:e2ee:verification", "accept",
			"--verification-id", "x",
		)
	})
}

func TestAppE2eeVerificationCancel(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"app:e2ee:verification", "cancel",
			"--verification-id", "x",
			"--code", "code",
			"--reason", "reason",
		)
	})

	t.Run("piping data", func(t *testing.T) {
		// Test piping YAML data over stdin
		pipeData := []byte("" +
			"code: code\n" +
			"reason: reason\n")
		mocktest.TestRunMockTestWithPipeAndFlags(
			t, pipeData,
			"--access-token", "string",
			"app:e2ee:verification", "cancel",
			"--verification-id", "x",
		)
	})
}
