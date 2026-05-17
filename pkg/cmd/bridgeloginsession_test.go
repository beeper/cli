// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

package cmd

import (
	"testing"

	"github.com/beeper/desktop-api-cli/internal/mocktest"
)

func TestBridgesLoginSessionsCreate(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"bridges:login-sessions", "create",
			"--bridge-id", "local-whatsapp",
			"--account-id", "x",
			"--flow-id", "x",
			"--login-id", "x",
		)
	})

	t.Run("piping data", func(t *testing.T) {
		// Test piping YAML data over stdin
		pipeData := []byte("" +
			"accountID: x\n" +
			"flowID: x\n" +
			"loginID: x\n")
		mocktest.TestRunMockTestWithPipeAndFlags(
			t, pipeData,
			"--access-token", "string",
			"bridges:login-sessions", "create",
			"--bridge-id", "local-whatsapp",
		)
	})
}

func TestBridgesLoginSessionsRetrieve(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"bridges:login-sessions", "retrieve",
			"--bridge-id", "local-whatsapp",
			"--login-session-id", "123",
		)
	})
}

func TestBridgesLoginSessionsCancel(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"bridges:login-sessions", "cancel",
			"--bridge-id", "local-whatsapp",
			"--login-session-id", "123",
		)
	})
}
