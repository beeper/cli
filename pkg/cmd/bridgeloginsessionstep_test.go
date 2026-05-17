// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

package cmd

import (
	"testing"

	"github.com/beeper/desktop-api-cli/internal/mocktest"
)

func TestBridgesLoginSessionsStepsSubmit(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"bridges:login-sessions:steps", "submit",
			"--bridge-id", "local-whatsapp",
			"--login-session-id", "123",
			"--step-id", "x",
			"--type", "user_input",
			"--fields", "{foo: string}",
			"--last-url", "lastURL",
			"--source", "api",
		)
	})

	t.Run("piping data", func(t *testing.T) {
		// Test piping YAML data over stdin
		pipeData := []byte("" +
			"type: user_input\n" +
			"fields:\n" +
			"  foo: string\n" +
			"lastURL: lastURL\n" +
			"source: api\n")
		mocktest.TestRunMockTestWithPipeAndFlags(
			t, pipeData,
			"--access-token", "string",
			"bridges:login-sessions:steps", "submit",
			"--bridge-id", "local-whatsapp",
			"--login-session-id", "123",
			"--step-id", "x",
		)
	})
}
