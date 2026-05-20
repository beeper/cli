package cli

import (
	"strings"

	"github.com/spf13/cobra"
)

func runCommand(opts *globalOptions, spec commandSpec, cmd *cobra.Command, args []string) error {
	switch spec.Name {
	case "auth:status", "auth:email:start", "auth:email:response", "auth:logout":
		return runAuthCommand(opts, spec, cmd, args)
	case "accounts", "accounts:list", "accounts:show", "accounts:use", "accounts:add", "accounts:remove":
		return runAccountCommand(opts, spec, cmd, args)
	case "bridges", "bridges:list", "bridges:show":
		return runBridgeCommand(opts, spec, cmd, args)
	case "contacts", "contacts:list", "contacts:search", "contacts:show":
		return runContactCommand(opts, spec, cmd, args)
	case "config:get", "config:path", "config:set", "config:reset":
		return runConfigCommand(opts, spec, cmd, args)
	case "doctor":
		return runDoctorCommand(opts, cmd, args)
	case "export":
		return runExportCommand(opts, cmd, args)
	case "install:desktop", "install:server":
		channel := firstFlag(cmd, "channel")
		serverEnv := firstFlag(cmd, "server-env")
		if spec.Name == "install:server" {
			installation, err := installServer(channel, serverEnv)
			if err != nil {
				return err
			}
			return printData(opts, installation)
		}
		installation, err := installDesktop(channel, serverEnv)
		if err != nil {
			return err
		}
		return printData(opts, installation)
	case "chats", "chats:list", "accounts:chats", "chats:show", "chats:search", "chats:archive", "chats:unarchive", "chats:avatar", "chats:description", "chats:disappear", "chats:draft", "chats:mark-read", "chats:mark-unread", "chats:mute", "chats:unmute", "chats:notify-anyway", "chats:pin", "chats:unpin", "chats:priority", "chats:remind", "chats:unremind", "chats:rename", "chats:start", "chats:focus":
		return runChatCommand(opts, spec, cmd, args)
	case "messages:list", "messages:search", "messages:show", "messages:context", "messages:export", "messages:delete", "messages:edit", "send:text", "send:file", "send:sticker", "send:voice", "send:react", "send:unreact":
		return runMessageCommand(opts, spec, cmd, args)
	case "media:download":
		return runMediaCommand(opts, spec, cmd, args)
	case "presence":
		return runPresenceCommand(opts, spec, cmd, args)
	case "targets:tunnel":
		return runTunnelCommand(opts, cmd, args)
	case "targets", "targets:list", "targets:show", "targets:add:desktop", "targets:add:remote", "targets:add:server", "targets:remove", "targets:use", "targets:status", "targets:start", "targets:stop", "targets:restart", "targets:enable", "targets:disable", "targets:logs":
		return runTargetCommand(opts, spec, cmd, args)
	case "verify", "verify:status", "verify:list", "verify:show", "verify:start", "verify:approve", "verify:cancel", "verify:sas", "verify:sas-confirm", "verify:qr-scan", "verify:qr-confirm", "verify:recovery-key", "verify:reset-recovery-key":
		return runVerifyCommand(opts, spec, cmd, args)
	case "status":
		target, err := resolveTarget(opts)
		if err != nil {
			return err
		}
		return printData(opts, map[string]any{"target": target, "readiness": evaluateReadiness(opts)})
	case "docs":
		return printData(opts, map[string]any{"url": "https://developers.beeper.com/desktop-api-reference"})
	case "man":
		return printManual(opts)
	case "plugins", "plugins:available":
		return printData(opts, map[string]any{
			"plugins": []string{},
			"builtIn": []string{"targets:tunnel"},
		})
	case "rpc":
		return runRPCCommand(opts, cmd, args)
	case "setup":
		return runSetupCommand(opts, cmd, args)
	case "update":
		return runUpdateCommand(opts, cmd, args)
	case "watch":
		return runWatchCommand(opts, cmd, args)
	default:
		return usageError("%s is registered but no Go handler is available", spec.Name)
	}
}

func printManual(opts *globalOptions) error {
	rows := []commandManualRow{}
	for _, spec := range generatedCommandSpecs {
		if spec.Name == "autocomplete" {
			continue
		}
		command := strings.ReplaceAll(spec.Name, ":", " ")
		rows = append(rows, commandManualRow{
			Command:      command,
			Description:  firstNonEmpty(spec.Summary, spec.Description),
			Mutates:      manualMutates(command, spec),
			RequiresAuth: manualRequiresAuth(command),
			Selectors:    manualSelectors(command),
			Output:       manualOutput(command, spec),
			Related:      manualRelated(command),
		})
	}
	return printData(opts, rows)
}

type commandManualRow struct {
	Command      string   `json:"command"`
	Description  string   `json:"description,omitempty"`
	Mutates      bool     `json:"mutates"`
	RequiresAuth bool     `json:"requiresAuth"`
	Selectors    []string `json:"selectors,omitempty"`
	Output       string   `json:"output"`
	Related      []string `json:"related,omitempty"`
}

func manualMutates(command string, spec commandSpec) bool {
	if spec.Write {
		return true
	}
	parts := strings.Fields(command)
	mutatingRoots := map[string]bool{"setup": true, "install": true, "send": true, "update": true}
	if len(parts) > 0 && mutatingRoots[parts[0]] {
		return true
	}
	mutatingVerbs := map[string]bool{
		"add": true, "archive": true, "unarchive": true, "pin": true, "unpin": true, "mute": true, "unmute": true,
		"mark-read": true, "mark-unread": true, "priority": true, "notify-anyway": true, "rename": true,
		"description": true, "avatar": true, "draft": true, "disappear": true, "remind": true, "unremind": true,
		"focus": true, "edit": true, "delete": true, "remove": true, "use": true, "set": true, "reset": true,
		"logout": true, "start": true, "stop": true, "restart": true, "enable": true, "disable": true,
		"approve": true, "recovery-key": true, "reset-recovery-key": true, "cancel": true, "sas": true,
		"sas-confirm": true, "qr-scan": true, "qr-confirm": true,
	}
	for _, part := range parts {
		if mutatingVerbs[part] {
			return true
		}
	}
	return false
}

func manualRequiresAuth(command string) bool {
	root := strings.Fields(command)
	if len(root) == 0 {
		return false
	}
	localOnly := map[string]bool{"auth": true, "config": true, "completion": true, "docs": true, "version": true, "man": true, "plugins": true}
	if localOnly[root[0]] {
		return false
	}
	if command == "targets" || strings.HasPrefix(command, "targets ") || strings.HasPrefix(command, "install ") || command == "update" {
		return false
	}
	return true
}

func manualSelectors(command string) []string {
	out := []string{}
	if strings.Contains(command, "chats ") || strings.Contains(command, "messages ") || strings.HasPrefix(command, "send ") || command == "presence" {
		out = append(out, "chat")
	}
	if strings.Contains(command, "accounts ") || strings.Contains(command, "contacts ") || command == "chats start" {
		out = append(out, "account")
	}
	if strings.Contains(command, "targets ") || command == "status" || command == "doctor" || strings.HasPrefix(command, "auth ") || strings.HasPrefix(command, "verify") {
		out = append(out, "target")
	}
	if strings.HasPrefix(command, "bridges ") || command == "accounts add" {
		out = append(out, "bridge")
	}
	if strings.Contains(command, "messages ") || strings.HasPrefix(command, "send react") || strings.HasPrefix(command, "send unreact") {
		out = append(out, "message")
	}
	return out
}

func manualOutput(command string, spec commandSpec) string {
	switch {
	case strings.HasPrefix(command, "send "):
		return "send-result"
	case command == "watch" || command == "rpc":
		return "stream"
	case command == "man":
		return "manual"
	case strings.HasSuffix(command, "list") || strings.Contains(command, "search") || command == "bridges list":
		return "list"
	case manualMutates(command, spec):
		return "success"
	default:
		return "data"
	}
}

func manualRelated(command string) []string {
	switch {
	case strings.HasPrefix(command, "send "):
		return []string{"messages list", "watch"}
	case strings.HasPrefix(command, "messages "):
		return []string{"chats list", "send text"}
	case strings.HasPrefix(command, "chats "):
		return []string{"messages list", "send text"}
	case strings.HasPrefix(command, "bridges "):
		return []string{"accounts add", "accounts list"}
	case strings.HasPrefix(command, "accounts "):
		return []string{"bridges list", "chats list"}
	case strings.HasPrefix(command, "targets "):
		return []string{"status", "doctor"}
	case command == "status":
		return []string{"doctor", "setup"}
	case command == "doctor":
		return []string{"status", "setup"}
	case strings.HasPrefix(command, "verify"):
		return []string{"setup", "status"}
	default:
		return nil
	}
}
