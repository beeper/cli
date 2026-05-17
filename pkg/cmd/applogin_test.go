// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

package cmd

import (
	"testing"

	"github.com/beeper/desktop-api-cli/internal/mocktest"
)

func TestAppLoginEmail(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"app:login", "email",
			"--email", "dev@stainless.com",
			"--setup-request-id", "setupRequestID",
		)
	})

	t.Run("piping data", func(t *testing.T) {
		// Test piping YAML data over stdin
		pipeData := []byte("" +
			"email: dev@stainless.com\n" +
			"setupRequestID: setupRequestID\n")
		mocktest.TestRunMockTestWithPipeAndFlags(
			t, pipeData,
			"--access-token", "string",
			"app:login", "email",
		)
	})
}

func TestAppLoginRegister(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"app:login", "register",
			"--accept-terms=true",
			"--lead-token", "leadToken",
			"--setup-request-id", "setupRequestID",
			"--username", "x",
		)
	})

	t.Run("piping data", func(t *testing.T) {
		// Test piping YAML data over stdin
		pipeData := []byte("" +
			"acceptTerms: true\n" +
			"leadToken: leadToken\n" +
			"setupRequestID: setupRequestID\n" +
			"username: x\n")
		mocktest.TestRunMockTestWithPipeAndFlags(
			t, pipeData,
			"--access-token", "string",
			"app:login", "register",
		)
	})
}

func TestAppLoginResponse(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"app:login", "response",
			"--response", "response",
			"--setup-request-id", "setupRequestID",
		)
	})

	t.Run("piping data", func(t *testing.T) {
		// Test piping YAML data over stdin
		pipeData := []byte("" +
			"response: response\n" +
			"setupRequestID: setupRequestID\n")
		mocktest.TestRunMockTestWithPipeAndFlags(
			t, pipeData,
			"--access-token", "string",
			"app:login", "response",
		)
	})
}

func TestAppLoginStart(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"app:login", "start",
		)
	})
}
