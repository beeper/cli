// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

package cmd

import (
	"testing"

	"github.com/beeper/desktop-api-cli/internal/mocktest"
)

func TestMatrixBridgesAuthListFlows(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"matrix:bridges:auth", "list-flows",
			"--bridge-id", "bridgeID",
		)
	})
}

func TestMatrixBridgesAuthListLogins(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"matrix:bridges:auth", "list-logins",
			"--bridge-id", "bridgeID",
		)
	})
}

func TestMatrixBridgesAuthLogout(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"matrix:bridges:auth", "logout",
			"--bridge-id", "bridgeID",
			"--login-id", "bcc68892-b180-414f-9516-b4aadf7d0496",
		)
	})
}

func TestMatrixBridgesAuthStartLogin(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"matrix:bridges:auth", "start-login",
			"--bridge-id", "bridgeID",
			"--flow-id", "qr",
			"--login-id", "bcc68892-b180-414f-9516-b4aadf7d0496",
		)
	})
}

func TestMatrixBridgesAuthSubmitCookies(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"matrix:bridges:auth", "submit-cookies",
			"--bridge-id", "bridgeID",
			"--login-process-id", "loginProcessID",
			"--step-id", "stepID",
			"--body", "{foo: string}",
		)
	})

	t.Run("piping data", func(t *testing.T) {
		// Test piping YAML data over stdin
		pipeData := []byte("foo: string")
		mocktest.TestRunMockTestWithPipeAndFlags(
			t, pipeData,
			"--access-token", "string",
			"matrix:bridges:auth", "submit-cookies",
			"--bridge-id", "bridgeID",
			"--login-process-id", "loginProcessID",
			"--step-id", "stepID",
		)
	})
}

func TestMatrixBridgesAuthSubmitUserInput(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"matrix:bridges:auth", "submit-user-input",
			"--bridge-id", "bridgeID",
			"--login-process-id", "loginProcessID",
			"--step-id", "stepID",
			"--body", "{foo: string}",
		)
	})

	t.Run("piping data", func(t *testing.T) {
		// Test piping YAML data over stdin
		pipeData := []byte("foo: string")
		mocktest.TestRunMockTestWithPipeAndFlags(
			t, pipeData,
			"--access-token", "string",
			"matrix:bridges:auth", "submit-user-input",
			"--bridge-id", "bridgeID",
			"--login-process-id", "loginProcessID",
			"--step-id", "stepID",
		)
	})
}

func TestMatrixBridgesAuthWaitForStep(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"matrix:bridges:auth", "wait-for-step",
			"--bridge-id", "bridgeID",
			"--login-process-id", "loginProcessID",
			"--step-id", "stepID",
		)
	})
}

func TestMatrixBridgesAuthWhoami(t *testing.T) {
	t.Run("regular flags", func(t *testing.T) {
		mocktest.TestRunMockTestWithFlags(
			t,
			"--access-token", "string",
			"matrix:bridges:auth", "whoami",
			"--bridge-id", "bridgeID",
		)
	})
}
