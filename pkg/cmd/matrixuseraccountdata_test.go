// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

package cmd

import (
	"testing"

	"github.com/beeper/desktop-api-cli/internal/mocktest"
)

func TestMatrixUsersAccountDataRetrieve(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"matrix:users:account-data", "retrieve",
			"--user-id", "@alice:example.com",
			"--type", "org.example.custom.config",
		)
	})
}

func TestMatrixUsersAccountDataUpdate(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"matrix:users:account-data", "update",
			"--user-id", "@alice:example.com",
			"--type", "org.example.custom.config",
			"--body", "{custom_account_data_key: custom_config_value}",
		)
	})

	t.Run("piping data", func(t *testing.T) {
		// Test piping YAML data over stdin
		pipeData := []byte("custom_account_data_key: custom_config_value")
		mocktest.TestRunMockTestWithPipeAndFlags(
			t, pipeData,
			"--access-token", "string",
			"matrix:users:account-data", "update",
			"--user-id", "@alice:example.com",
			"--type", "org.example.custom.config",
		)
	})
}
