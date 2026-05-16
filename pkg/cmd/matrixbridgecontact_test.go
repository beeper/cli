// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

package cmd

import (
	"testing"

	"github.com/beeper/desktop-api-cli/internal/mocktest"
)

func TestMatrixBridgesContactsList(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"matrix:bridges:contacts", "list",
			"--bridge-id", "bridgeID",
			"--login-id", "bcc68892-b180-414f-9516-b4aadf7d0496",
		)
	})
}
