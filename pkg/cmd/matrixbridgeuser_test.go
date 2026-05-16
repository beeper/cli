// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

package cmd

import (
	"testing"

	"github.com/beeper/desktop-api-cli/internal/mocktest"
)

func TestMatrixBridgesUsersResolve(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"matrix:bridges:users", "resolve",
			"--bridge-id", "bridgeID",
			"--identifier", "identifier",
			"--login-id", "bcc68892-b180-414f-9516-b4aadf7d0496",
		)
	})
}

func TestMatrixBridgesUsersSearch(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"matrix:bridges:users", "search",
			"--bridge-id", "bridgeID",
			"--login-id", "bcc68892-b180-414f-9516-b4aadf7d0496",
			"--query", "query",
		)
	})

	t.Run("piping data", func(t *testing.T) {
		// Test piping YAML data over stdin
		pipeData := []byte("query: query")
		mocktest.TestRunMockTestWithPipeAndFlags(
			t, pipeData,
			"--access-token", "string",
			"matrix:bridges:users", "search",
			"--bridge-id", "bridgeID",
			"--login-id", "bcc68892-b180-414f-9516-b4aadf7d0496",
		)
	})
}
