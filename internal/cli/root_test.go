package cli

import (
	"bytes"
	"strings"
	"testing"
)

func TestRootHelpHidesInternalAndShowsMajorTopics(t *testing.T) {
	cmd := NewRootCommand()
	out := &bytes.Buffer{}
	cmd.SetOut(out)
	cmd.SetErr(out)
	cmd.SetArgs([]string{"--help"})
	if err := cmd.Execute(); err != nil {
		t.Fatalf("help failed: %v", err)
	}
	help := out.String()
	for _, want := range []string{"targets", "chats", "messages", "verify", "plugins", "completion"} {
		if !strings.Contains(help, want) {
			t.Fatalf("help missing %q:\n%s", want, help)
		}
	}
	if strings.Contains(help, "autocomplete") {
		t.Fatalf("help exposes internal autocomplete command:\n%s", help)
	}
}

func TestGeneratedCommandRoutesExist(t *testing.T) {
	root := NewRootCommand()
	for _, path := range []string{
		"setup",
		"targets add desktop",
		"auth email start",
		"verify sas-confirm",
		"accounts list",
		"chats list",
		"messages search",
		"send text",
	} {
		cmd, _, err := root.Find(strings.Fields(path))
		if err != nil {
			t.Fatalf("find %q failed: %v", path, err)
		}
		if cmd == nil || cmd.CommandPath() != "beeper "+path {
			t.Fatalf("find %q got %v", path, cmd)
		}
	}
}

func TestAllGeneratedCommandSpecsResolve(t *testing.T) {
	root := NewRootCommand()
	for _, spec := range generatedCommandSpecs {
		if spec.Name == "autocomplete" {
			continue
		}
		path := strings.ReplaceAll(spec.Name, ":", " ")
		cmd, _, err := root.Find(strings.Fields(path))
		if err != nil {
			t.Fatalf("find generated command %q failed: %v", spec.Name, err)
		}
		if cmd == nil {
			t.Fatalf("find generated command %q returned nil", spec.Name)
		}
		if got, want := cmd.CommandPath(), "beeper "+path; got != want {
			t.Fatalf("find generated command %q got %q, want %q", spec.Name, got, want)
		}
	}
}

func TestAllPublicCommandHelpPathsExecute(t *testing.T) {
	for _, spec := range generatedCommandSpecs {
		if spec.Name == "autocomplete" {
			continue
		}
		cmd := NewRootCommand()
		out := &bytes.Buffer{}
		cmd.SetOut(out)
		cmd.SetErr(out)
		args := append(strings.Fields(strings.ReplaceAll(spec.Name, ":", " ")), "--help")
		cmd.SetArgs(args)
		if err := cmd.Execute(); err != nil {
			t.Fatalf("help for %q failed: %v\n%s", spec.Name, err, out.String())
		}
	}
}

func TestRawAPICommandsAreNotRegistered(t *testing.T) {
	root := NewRootCommand()
	for _, path := range []string{"api", "api get", "api post", "api request"} {
		cmd, _, err := root.Find(strings.Fields(path))
		if err == nil && cmd != root {
			t.Fatalf("raw API command %q should not be registered", path)
		}
	}
}

func TestGeneratedFlagsDoNotShadowGlobalJSON(t *testing.T) {
	root := NewRootCommand()
	cmd, _, err := root.Find([]string{"watch"})
	if err != nil {
		t.Fatal(err)
	}
	if cmd.Flags().Lookup("json") != nil {
		t.Fatal("watch should use the inherited global --json flag")
	}
	if cmd.Root().PersistentFlags().Lookup("json") == nil {
		t.Fatal("root is missing persistent --json")
	}
}

func TestHiddenSemanticCompleteCommandResolvesTargets(t *testing.T) {
	t.Setenv("BEEPER_CLI_CONFIG_DIR", t.TempDir())
	cmd := NewRootCommand()
	out := &bytes.Buffer{}
	cmd.SetOut(out)
	cmd.SetErr(out)
	cmd.SetArgs([]string{"_complete", "target", "--query", "desk", "--limit", "5"})
	if err := cmd.Execute(); err != nil {
		t.Fatalf("_complete target failed: %v", err)
	}
	if !strings.Contains(out.String(), "desktop\t") {
		t.Fatalf("missing desktop target completion: %q", out.String())
	}
}

func TestCompletionSemanticFlag(t *testing.T) {
	cmd := NewRootCommand()
	out := &bytes.Buffer{}
	cmd.SetOut(out)
	cmd.SetErr(out)
	cmd.SetArgs([]string{"completion", "bash", "--semantic"})
	if err := cmd.Execute(); err != nil {
		t.Fatalf("completion --semantic failed: %v", err)
	}
	if !strings.Contains(out.String(), "beeper _complete") {
		t.Fatalf("semantic completion missing _complete call: %q", out.String())
	}
}

func TestCompletionInfersShell(t *testing.T) {
	t.Setenv("SHELL", "/bin/bash")
	cmd := NewRootCommand()
	out := &bytes.Buffer{}
	cmd.SetOut(out)
	cmd.SetErr(out)
	cmd.SetArgs([]string{"completion"})
	if err := cmd.Execute(); err != nil {
		t.Fatalf("completion should infer shell: %v", err)
	}
	if !strings.Contains(out.String(), "bash completion") {
		t.Fatalf("completion output does not look like bash completion: %q", out.String()[:min(80, out.Len())])
	}
}

func TestReadOnlyBlocksWriteCommands(t *testing.T) {
	cmd := NewRootCommand()
	out := &bytes.Buffer{}
	cmd.SetOut(out)
	cmd.SetErr(out)
	cmd.SetArgs([]string{"--read-only", "send", "text", "--to", "chat", "--message", "hello"})
	err := cmd.Execute()
	if err == nil {
		t.Fatal("expected read-only write command to fail")
	}
	if !strings.Contains(err.Error(), "read-only mode") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestUpdateCheckAllowedInReadOnlyMode(t *testing.T) {
	t.Setenv("BEEPER_CLI_CONFIG_DIR", t.TempDir())
	cmd := NewRootCommand()
	out := &bytes.Buffer{}
	cmd.SetOut(out)
	cmd.SetErr(out)
	cmd.SetArgs([]string{"--read-only", "update", "--check", "--server", "--json"})
	if err := cmd.Execute(); err != nil {
		t.Fatalf("update --check should be allowed in read-only mode: %v", err)
	}
}

func TestUpdateInstallBlockedInReadOnlyMode(t *testing.T) {
	t.Setenv("BEEPER_CLI_CONFIG_DIR", t.TempDir())
	cmd := NewRootCommand()
	out := &bytes.Buffer{}
	cmd.SetOut(out)
	cmd.SetErr(out)
	cmd.SetArgs([]string{"--read-only", "update", "--server"})
	err := cmd.Execute()
	if err == nil {
		t.Fatal("expected update without --check to fail in read-only mode")
	}
	if !strings.Contains(err.Error(), "read-only mode") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestReadOnlyAllowsTargetInspection(t *testing.T) {
	t.Setenv("BEEPER_CLI_CONFIG_DIR", t.TempDir())
	cmd := NewRootCommand()
	out := &bytes.Buffer{}
	cmd.SetOut(out)
	cmd.SetErr(out)
	cmd.SetArgs([]string{"--read-only", "targets", "list", "--json"})
	if err := cmd.Execute(); err != nil {
		t.Fatalf("targets list should be allowed in read-only mode: %v", err)
	}
}

func TestReadOnlyBlocksEmailStart(t *testing.T) {
	t.Setenv("BEEPER_CLI_CONFIG_DIR", t.TempDir())
	cmd := NewRootCommand()
	out := &bytes.Buffer{}
	cmd.SetOut(out)
	cmd.SetErr(out)
	cmd.SetArgs([]string{"--read-only", "auth", "email", "start", "--email", "user@example.com"})
	err := cmd.Execute()
	if err == nil {
		t.Fatal("expected auth email start to fail in read-only mode")
	}
	if !strings.Contains(err.Error(), "read-only mode") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestWebViewFlagsFailExplicitly(t *testing.T) {
	t.Setenv("BEEPER_CLI_CONFIG_DIR", t.TempDir())
	cmd := NewRootCommand()
	out := &bytes.Buffer{}
	cmd.SetOut(out)
	cmd.SetErr(out)
	cmd.SetArgs([]string{"accounts", "add", "whatsapp", "--webview-timeout", "1"})
	err := cmd.Execute()
	if err == nil {
		t.Fatal("expected WebView flag to fail")
	}
	if !strings.Contains(err.Error(), "WebView management is not available") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestChatsStartTitleFailsExplicitly(t *testing.T) {
	t.Setenv("BEEPER_CLI_CONFIG_DIR", t.TempDir())
	cmd := NewRootCommand()
	out := &bytes.Buffer{}
	cmd.SetOut(out)
	cmd.SetErr(out)
	cmd.SetArgs([]string{"chats", "start", "bob", "--title", "Test"})
	err := cmd.Execute()
	if err == nil {
		t.Fatal("expected chats start --title to fail")
	}
	if !strings.Contains(err.Error(), "not exposed by github.com/beeper/desktop-api-go") {
		t.Fatalf("unexpected error: %v", err)
	}
}
