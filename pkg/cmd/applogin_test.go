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
			"--request", "request",
		)
	})

	t.Run("piping data", func(t *testing.T) {
		// Test piping YAML data over stdin
		pipeData := []byte("" +
			"email: dev@stainless.com\n" +
			"request: request\n")
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
			"--request", "request",
			"--username", "x",
		)
	})

	t.Run("piping data", func(t *testing.T) {
		// Test piping YAML data over stdin
		pipeData := []byte("" +
			"acceptTerms: true\n" +
			"leadToken: leadToken\n" +
			"request: request\n" +
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
			"--request", "request",
			"--response", "response",
		)
	})

	t.Run("piping data", func(t *testing.T) {
		// Test piping YAML data over stdin
		pipeData := []byte("" +
			"request: request\n" +
			"response: response\n")
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
