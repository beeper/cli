// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

package cmd

import (
	"testing"

	"github.com/beeper/desktop-api-cli/internal/mocktest"
)

func TestMatrixRoomsAccountDataRetrieve(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"matrix:rooms:account-data", "retrieve",
			"--user-id", "@alice:example.com",
			"--room-id", "!726s6s6q:example.com",
			"--type", "org.example.custom.room.config",
		)
	})
}

func TestMatrixRoomsAccountDataUpdate(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"matrix:rooms:account-data", "update",
			"--user-id", "@alice:example.com",
			"--room-id", "!726s6s6q:example.com",
			"--type", "org.example.custom.room.config",
			"--body", "{custom_account_data_key: custom_account_data_value}",
		)
	})

	t.Run("piping data", func(t *testing.T) {
		// Test piping YAML data over stdin
		pipeData := []byte("custom_account_data_key: custom_account_data_value")
		mocktest.TestRunMockTestWithPipeAndFlags(
			t, pipeData,
			"--access-token", "string",
			"matrix:rooms:account-data", "update",
			"--user-id", "@alice:example.com",
			"--room-id", "!726s6s6q:example.com",
			"--type", "org.example.custom.room.config",
		)
	})
}
