package cli

import "github.com/spf13/cobra"

type commandSpec struct {
	Name        string
	Source      string
	Summary     string
	Description string
	Write       bool
}

var generatedCommandSpecs = []commandSpec{
	{Name: `accounts`, Source: `accounts/list`, Summary: `List connected accounts`, Description: ``, Write: false},
	{Name: `accounts:add`, Source: `accounts/add`, Summary: `Connect a chat account by bridge`, Description: `` + "`" + `accounts add` + "`" + ` without an argument opens the guided bridge chooser. Pass a bridge ID when you already know which chat network connector to use.`, Write: true},
	{Name: `accounts:chats`, Source: `chats/list`, Summary: `List chats`, Description: ``, Write: false},
	{Name: `accounts:list`, Source: `accounts/list`, Summary: `List connected accounts`, Description: ``, Write: false},
	{Name: `accounts:remove`, Source: `accounts/remove`, Summary: `Remove an account`, Description: ``, Write: true},
	{Name: `accounts:show`, Source: `accounts/show`, Summary: `Show account details`, Description: ``, Write: false},
	{Name: `accounts:use`, Source: `accounts/use`, Summary: `Select a default account for account-scoped commands`, Description: `Persists the choice in CLI config. Account-scoped commands that take --account fall back to this default when --account is omitted. Use ` + "`" + `beeper accounts use ""` + "`" + ` (or ` + "`" + `beeper config set defaultAccount ""` + "`" + `) to clear.`, Write: true},
	{Name: `auth:email:response`, Source: `auth/email/response`, Summary: `Finish email sign-in with a verification code`, Description: ``, Write: true},
	{Name: `auth:email:start`, Source: `auth/email/start`, Summary: `Start email sign-in for a target`, Description: ``, Write: true},
	{Name: `auth:logout`, Source: `auth/logout`, Summary: `Clear stored authentication`, Description: ``, Write: true},
	{Name: `auth:status`, Source: `auth/status`, Summary: `Show stored auth for the selected target`, Description: ``, Write: false},
	{Name: `autocomplete`, Source: `autocomplete`, Summary: ``, Description: ``, Write: false},
	{Name: `bridges`, Source: `bridges/list`, Summary: `List bridges that can connect chat accounts`, Description: `` + "`" + `bridges list` + "`" + ` is the scriptable bridge catalog. Use ` + "`" + `accounts add` + "`" + ` without an argument for the guided account connection flow.`, Write: false},
	{Name: `bridges:list`, Source: `bridges/list`, Summary: `List bridges that can connect chat accounts`, Description: `` + "`" + `bridges list` + "`" + ` is the scriptable bridge catalog. Use ` + "`" + `accounts add` + "`" + ` without an argument for the guided account connection flow.`, Write: false},
	{Name: `bridges:show`, Source: `bridges/show`, Summary: `Show bridge details, login flows, and connected accounts`, Description: ``, Write: false},
	{Name: `chats`, Source: `chats/list`, Summary: `List chats`, Description: ``, Write: false},
	{Name: `chats:archive`, Source: `chats/archive`, Summary: `Archive a chat`, Description: ``, Write: true},
	{Name: `chats:avatar`, Source: `chats/avatar`, Summary: `Set a chat avatar`, Description: ``, Write: true},
	{Name: `chats:description`, Source: `chats/description`, Summary: `Set a chat description`, Description: ``, Write: true},
	{Name: `chats:disappear`, Source: `chats/disappear`, Summary: `Set disappearing-message expiry`, Description: ``, Write: true},
	{Name: `chats:draft`, Source: `chats/draft`, Summary: `Set or clear a chat draft`, Description: ``, Write: true},
	{Name: `chats:focus`, Source: `chats/focus`, Summary: `Focus Beeper Desktop on a chat`, Description: ``, Write: true},
	{Name: `chats:list`, Source: `chats/list`, Summary: `List chats`, Description: ``, Write: false},
	{Name: `chats:mark-read`, Source: `chats/mark-read`, Summary: `Mark a chat as read`, Description: ``, Write: true},
	{Name: `chats:mark-unread`, Source: `chats/mark-unread`, Summary: `Mark a chat as unread`, Description: ``, Write: true},
	{Name: `chats:mute`, Source: `chats/mute`, Summary: `Mute a chat`, Description: ``, Write: true},
	{Name: `chats:notify-anyway`, Source: `chats/notify-anyway`, Summary: `Send an iMessage Notify Anyway alert`, Description: ``, Write: true},
	{Name: `chats:pin`, Source: `chats/pin`, Summary: `Pin a chat`, Description: ``, Write: true},
	{Name: `chats:priority`, Source: `chats/priority`, Summary: `Move a chat to the Inbox or Low Priority`, Description: ``, Write: true},
	{Name: `chats:remind`, Source: `chats/remind`, Summary: `Set a chat reminder`, Description: ``, Write: true},
	{Name: `chats:rename`, Source: `chats/rename`, Summary: `Rename a chat`, Description: ``, Write: true},
	{Name: `chats:search`, Source: `chats/search`, Summary: `Search chats`, Description: ``, Write: false},
	{Name: `chats:show`, Source: `chats/show`, Summary: `Show chat details`, Description: ``, Write: false},
	{Name: `chats:start`, Source: `chats/start`, Summary: `Start a chat`, Description: ``, Write: true},
	{Name: `chats:unarchive`, Source: `chats/unarchive`, Summary: `Unarchive a chat`, Description: ``, Write: true},
	{Name: `chats:unmute`, Source: `chats/unmute`, Summary: `Unmute a chat`, Description: ``, Write: true},
	{Name: `chats:unpin`, Source: `chats/unpin`, Summary: `Unpin a chat`, Description: ``, Write: true},
	{Name: `chats:unremind`, Source: `chats/unremind`, Summary: `Clear a chat reminder`, Description: ``, Write: true},
	{Name: `completion`, Source: `completion`, Summary: `Print shell completion setup`, Description: ``, Write: false},
	{Name: `config:get`, Source: `config/get`, Summary: `Print CLI configuration`, Description: ``, Write: false},
	{Name: `config:path`, Source: `config/path`, Summary: `Print the CLI config path`, Description: ``, Write: false},
	{Name: `config:reset`, Source: `config/reset`, Summary: `Reset CLI configuration`, Description: ``, Write: true},
	{Name: `config:set`, Source: `config/set`, Summary: `Set a CLI configuration value`, Description: ``, Write: true},
	{Name: `contacts`, Source: `contacts/list`, Summary: `List contacts`, Description: ``, Write: false},
	{Name: `contacts:list`, Source: `contacts/list`, Summary: `List contacts`, Description: ``, Write: false},
	{Name: `contacts:search`, Source: `contacts/search`, Summary: `Search contacts`, Description: ``, Write: false},
	{Name: `contacts:show`, Source: `contacts/show`, Summary: `Show contact details`, Description: ``, Write: false},
	{Name: `docs`, Source: `docs`, Summary: `Open Beeper CLI docs`, Description: ``, Write: false},
	{Name: `doctor`, Source: `doctor`, Summary: `Probe the target live and report diagnostics`, Description: `Active reachability check plus readiness diagnostics. Exits non-zero when the target is not ready. For a cheap snapshot use ` + "`" + `beeper status` + "`" + `.`, Write: false},
	{Name: `export`, Source: `export`, Summary: `Export accounts, chats, messages, Markdown transcripts, and attachments`, Description: ``, Write: false},
	{Name: `install:desktop`, Source: `install/desktop`, Summary: `Install Beeper Desktop locally`, Description: ``, Write: true},
	{Name: `install:server`, Source: `install/server`, Summary: `Install Beeper Server locally`, Description: ``, Write: true},
	{Name: `man`, Source: `man`, Summary: `Print the command manual`, Description: ``, Write: false},
	{Name: `media:download`, Source: `media/download`, Summary: `Download message media`, Description: ``, Write: true},
	{Name: `messages:context`, Source: `messages/context`, Summary: `Show message context`, Description: ``, Write: false},
	{Name: `messages:delete`, Source: `messages/delete`, Summary: `Delete a message`, Description: ``, Write: true},
	{Name: `messages:edit`, Source: `messages/edit`, Summary: `Edit a message`, Description: ``, Write: true},
	{Name: `messages:export`, Source: `messages/export`, Summary: `Export one chat to JSON`, Description: `Lightweight per-chat JSON export. For a full export with transcripts, attachments, and multiple chats, use ` + "`" + `beeper export` + "`" + `.`, Write: false},
	{Name: `messages:list`, Source: `messages/list`, Summary: `List chat messages`, Description: ``, Write: false},
	{Name: `messages:search`, Source: `messages/search`, Summary: `Search messages across chats`, Description: ``, Write: false},
	{Name: `messages:show`, Source: `messages/show`, Summary: `Show one message`, Description: ``, Write: false},
	{Name: `plugins`, Source: `plugins`, Summary: `Show built-in extension status`, Description: `The Go CLI does not load external plugins; formerly optional functionality is built in where supported.`, Write: false},
	{Name: `plugins:available`, Source: `plugins/available`, Summary: `Show built-in extension status`, Description: ``, Write: false},
	{Name: `presence`, Source: `presence`, Summary: `Send a typing (or paused) indicator to a chat`, Description: `Requires server-side support. Networks without typing notifications return an error.`, Write: true},
	{Name: `rpc`, Source: `rpc`, Summary: `Run newline-delimited JSON command RPC over stdin/stdout`, Description: `Reads JSON lines like {"id":1,"command":"send text --to 10313 --message hello"} or {"id":1,"args":["status","--json"]}.`, Write: false},
	{Name: `send:file`, Source: `send/file`, Summary: `Send a file`, Description: `Returns when Desktop accepts the send request. Pass ` + "`" + `--wait` + "`" + ` to wait until the message leaves the pending state or fails.`, Write: true},
	{Name: `send:react`, Source: `send/react`, Summary: `Send a reaction to a message`, Description: ``, Write: true},
	{Name: `send:sticker`, Source: `send/sticker`, Summary: `Send a sticker`, Description: `Uploads the file and sends as a sticker message. Defaults --mime to image/webp.`, Write: true},
	{Name: `send:text`, Source: `send/text`, Summary: `Send a text message`, Description: `Returns when Desktop accepts the send request. Pass ` + "`" + `--wait` + "`" + ` to wait until the message leaves the pending state or fails.`, Write: true},
	{Name: `send:unreact`, Source: `send/unreact`, Summary: `Remove a reaction from a message`, Description: ``, Write: true},
	{Name: `send:voice`, Source: `send/voice`, Summary: `Send a voice note`, Description: `Uploads the audio file and sends as a voice note. Defaults --mime to audio/ogg.`, Write: true},
	{Name: `setup`, Source: `setup`, Summary: `Make the selected target ready for messaging`, Description: ``, Write: true},
	{Name: `status`, Source: `status`, Summary: `Show selected target and setup readiness`, Description: `Read-only readiness snapshot for the selected target. For active reachability checks and diagnostics, run ` + "`" + `beeper doctor` + "`" + `.`, Write: false},
	{Name: `targets`, Source: `targets/list`, Summary: `List configured Beeper targets`, Description: ``, Write: false},
	{Name: `targets:tunnel`, Source: `targets/tunnel`, Summary: `Expose a Beeper target through Cloudflare Tunnel`, Description: `Starts a Cloudflare quick tunnel for the selected Beeper Desktop or Server API target. The command stays in the foreground until interrupted.`, Write: true},
	{Name: `targets:add:desktop`, Source: `targets/add/desktop`, Summary: `Add a managed Beeper Desktop target`, Description: ``, Write: true},
	{Name: `targets:add:remote`, Source: `targets/add/remote`, Summary: `Add a remote Beeper Desktop or Server target`, Description: ``, Write: true},
	{Name: `targets:add:server`, Source: `targets/add/server`, Summary: `Add a managed Beeper Server target`, Description: ``, Write: true},
	{Name: `targets:disable`, Source: `targets/disable`, Summary: `Disable a local Beeper Server target at login`, Description: ``, Write: true},
	{Name: `targets:enable`, Source: `targets/enable`, Summary: `Enable a local Beeper Server target at login`, Description: ``, Write: true},
	{Name: `targets:list`, Source: `targets/list`, Summary: `List configured Beeper targets`, Description: ``, Write: false},
	{Name: `targets:logs`, Source: `targets/logs`, Summary: `Print logs for a local Beeper Desktop or Server install`, Description: ``, Write: false},
	{Name: `targets:remove`, Source: `targets/remove`, Summary: `Remove a target`, Description: ``, Write: true},
	{Name: `targets:restart`, Source: `targets/restart`, Summary: `Restart a local Beeper Server target`, Description: ``, Write: true},
	{Name: `targets:show`, Source: `targets/show`, Summary: `Show target details`, Description: ``, Write: false},
	{Name: `targets:start`, Source: `targets/start`, Summary: `Start a local Server target or open Beeper Desktop`, Description: ``, Write: true},
	{Name: `targets:status`, Source: `targets/status`, Summary: `Check endpoint and process reachability for a target`, Description: ``, Write: false},
	{Name: `targets:stop`, Source: `targets/stop`, Summary: `Stop a local Beeper Server target`, Description: ``, Write: true},
	{Name: `targets:use`, Source: `targets/use`, Summary: `Set the default target`, Description: ``, Write: true},
	{Name: `update`, Source: `update`, Summary: `Check and install Beeper updates`, Description: ``, Write: true},
	{Name: `verify`, Source: `verify`, Summary: `Finish setup verification or verify another device`, Description: ``, Write: true},
	{Name: `verify:approve`, Source: `verify/approve`, Summary: `Approve a pending device verification request`, Description: ``, Write: true},
	{Name: `verify:cancel`, Source: `verify/cancel`, Summary: `Cancel an in-progress device verification`, Description: ``, Write: true},
	{Name: `verify:list`, Source: `verify/list`, Summary: `List active verification work`, Description: ``, Write: false},
	{Name: `verify:qr-confirm`, Source: `verify/qr-confirm`, Summary: `Confirm that the other device scanned your QR code`, Description: ``, Write: true},
	{Name: `verify:qr-scan`, Source: `verify/qr-scan`, Summary: `Submit a scanned QR-code verification payload`, Description: ``, Write: true},
	{Name: `verify:recovery-key`, Source: `verify/recovery-key`, Summary: `Unlock encrypted messages with a recovery key`, Description: ``, Write: true},
	{Name: `verify:reset-recovery-key`, Source: `verify/reset-recovery-key`, Summary: `Create a new encrypted-messages recovery key`, Description: ``, Write: true},
	{Name: `verify:sas`, Source: `verify/sas`, Summary: `Start emoji verification`, Description: ``, Write: true},
	{Name: `verify:sas-confirm`, Source: `verify/sas-confirm`, Summary: `Confirm matching emoji verification`, Description: ``, Write: true},
	{Name: `verify:show`, Source: `verify/show`, Summary: `Show the current active verification request`, Description: ``, Write: false},
	{Name: `verify:start`, Source: `verify/start`, Summary: `Start a device verification request`, Description: ``, Write: true},
	{Name: `verify:status`, Source: `verify/status`, Summary: `Show encryption and device-verification readiness`, Description: ``, Write: false},
	{Name: `version`, Source: `version`, Summary: `Print CLI version`, Description: ``, Write: false},
	{Name: `watch`, Source: `watch`, Summary: `Stream Desktop API WebSocket events`, Description: ``, Write: false},
}

type flagSpec struct {
	Command     string
	Name        string
	Shorthand   string
	Kind        string
	Description string
	Required    bool
	Multiple    bool
	DefaultTrue bool
}

type argSpec struct {
	Command     string
	Name        string
	Description string
	Required    bool
}

var generatedFlagSpecs = []flagSpec{
	{Command: `accounts`, Name: `account`, Shorthand: ``, Kind: `string`, Description: `Filter by account selector`, Required: false, Multiple: true, DefaultTrue: false},
	{Command: `accounts`, Name: `ids`, Shorthand: ``, Kind: `boolean`, Description: `Print only account IDs`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `accounts:add`, Name: `cookie`, Shorthand: ``, Kind: `string`, Description: `Cookie value for non-interactive login, in name=value form. Repeat for multiple cookies.`, Required: false, Multiple: true, DefaultTrue: false},
	{Command: `accounts:add`, Name: `field`, Shorthand: ``, Kind: `string`, Description: `Field value for non-interactive login, in id=value form. Repeat for multiple fields.`, Required: false, Multiple: true, DefaultTrue: false},
	{Command: `accounts:add`, Name: `flow`, Shorthand: ``, Kind: `string`, Description: `Login flow ID. If omitted, Desktop chooses the default flow.`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `accounts:add`, Name: `guided`, Shorthand: ``, Kind: `boolean`, Description: `Prompt through login steps until completion`, Required: false, Multiple: false, DefaultTrue: true},
	{Command: `accounts:add`, Name: `login-id`, Shorthand: ``, Kind: `string`, Description: `Existing login ID to re-login as`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `accounts:add`, Name: `non-interactive`, Shorthand: ``, Kind: `boolean`, Description: `Do not prompt; require --flow, --field, and --cookie values when needed.`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `accounts:add`, Name: `webview`, Shorthand: ``, Kind: `boolean`, Description: `Use WebView to collect cookie login fields when a cookie step is returned.`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `accounts:add`, Name: `webview-backend`, Shorthand: ``, Kind: `string`, Description: `WebView backend for cookie login steps.`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `accounts:add`, Name: `webview-timeout`, Shorthand: ``, Kind: `integer`, Description: `Seconds to wait for WebView cookie collection.`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `accounts:chats`, Name: `account`, Shorthand: ``, Kind: `string`, Description: `Limit to account selector`, Required: false, Multiple: true, DefaultTrue: false},
	{Command: `accounts:chats`, Name: `ids`, Shorthand: ``, Kind: `boolean`, Description: `Print preferred chat selectors, using numeric local chat IDs when available`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `accounts:chats`, Name: `limit`, Shorthand: ``, Kind: `integer`, Description: `Maximum chats to print`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `accounts:chats`, Name: `archived`, Shorthand: ``, Kind: `boolean`, Description: `Only archived chats (--no-archived to exclude)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `accounts:chats`, Name: `pinned`, Shorthand: ``, Kind: `boolean`, Description: `Only pinned chats (--no-pinned to exclude)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `accounts:chats`, Name: `muted`, Shorthand: ``, Kind: `boolean`, Description: `Only muted chats (--no-muted to exclude)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `accounts:chats`, Name: `unread`, Shorthand: ``, Kind: `boolean`, Description: `Only chats with unread messages (--no-unread to exclude)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `accounts:chats`, Name: `low-priority`, Shorthand: ``, Kind: `boolean`, Description: `Only Low Priority chats (--no-low-priority to exclude)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `accounts:list`, Name: `account`, Shorthand: ``, Kind: `string`, Description: `Filter by account selector`, Required: false, Multiple: true, DefaultTrue: false},
	{Command: `accounts:list`, Name: `ids`, Shorthand: ``, Kind: `boolean`, Description: `Print only account IDs`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `auth:email:response`, Name: `code`, Shorthand: ``, Kind: `string`, Description: `Email verification code`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `auth:email:response`, Name: `setup-request-id`, Shorthand: ``, Kind: `string`, Description: `Setup request ID from auth email start`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `auth:email:response`, Name: `username`, Shorthand: ``, Kind: `string`, Description: `Username to use if setup creates a new account`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `auth:email:response`, Name: `yes`, Shorthand: ``, Kind: `boolean`, Description: `Accept required registration prompts non-interactively`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `auth:email:start`, Name: `email`, Shorthand: ``, Kind: `string`, Description: `Email address to sign in with`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `chats`, Name: `account`, Shorthand: ``, Kind: `string`, Description: `Limit to account selector`, Required: false, Multiple: true, DefaultTrue: false},
	{Command: `chats`, Name: `ids`, Shorthand: ``, Kind: `boolean`, Description: `Print preferred chat selectors, using numeric local chat IDs when available`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `chats`, Name: `limit`, Shorthand: ``, Kind: `integer`, Description: `Maximum chats to print`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `chats`, Name: `archived`, Shorthand: ``, Kind: `boolean`, Description: `Only archived chats (--no-archived to exclude)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `chats`, Name: `pinned`, Shorthand: ``, Kind: `boolean`, Description: `Only pinned chats (--no-pinned to exclude)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `chats`, Name: `muted`, Shorthand: ``, Kind: `boolean`, Description: `Only muted chats (--no-muted to exclude)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `chats`, Name: `unread`, Shorthand: ``, Kind: `boolean`, Description: `Only chats with unread messages (--no-unread to exclude)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `chats`, Name: `low-priority`, Shorthand: ``, Kind: `boolean`, Description: `Only Low Priority chats (--no-low-priority to exclude)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `chats:archive`, Name: `chat`, Shorthand: ``, Kind: `string`, Description: `Chat selector (ID, local ID, title, or search text)`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `chats:avatar`, Name: `chat`, Shorthand: ``, Kind: `string`, Description: `Chat selector (ID, local ID, title, or search text)`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `chats:description`, Name: `chat`, Shorthand: ``, Kind: `string`, Description: `Chat selector (ID, local ID, title, or search text)`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `chats:disappear`, Name: `chat`, Shorthand: ``, Kind: `string`, Description: `Chat selector (ID, local ID, title, or search text)`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `chats:disappear`, Name: `pick`, Shorthand: ``, Kind: `integer`, Description: `Pick the Nth result when the selector is ambiguous (1-indexed)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `chats:disappear`, Name: `seconds`, Shorthand: ``, Kind: `string`, Description: `Timer in seconds, or "off" to disable`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `chats:draft`, Name: `chat`, Shorthand: ``, Kind: `string`, Description: `Chat selector (ID, local ID, title, or search text)`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `chats:draft`, Name: `pick`, Shorthand: ``, Kind: `integer`, Description: `Pick the Nth result when the selector is ambiguous (1-indexed)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `chats:draft`, Name: `text`, Shorthand: ``, Kind: `string`, Description: `Draft text. Omit and pass --clear to remove the draft.`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `chats:draft`, Name: `file`, Shorthand: ``, Kind: `string`, Description: `Attachment file to upload with the draft`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `chats:draft`, Name: `filename`, Shorthand: ``, Kind: `string`, Description: `Override the displayed filename of the attachment`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `chats:draft`, Name: `mime`, Shorthand: ``, Kind: `string`, Description: `Override MIME type detection for the attachment`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `chats:draft`, Name: `clear`, Shorthand: ``, Kind: `boolean`, Description: `Clear the existing draft instead of setting one`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `chats:focus`, Name: `chat`, Shorthand: ``, Kind: `string`, Description: `Chat selector (ID, local ID, title, or search text)`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `chats:focus`, Name: `pick`, Shorthand: ``, Kind: `integer`, Description: `Pick the Nth result when the selector is ambiguous (1-indexed)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `chats:focus`, Name: `message`, Shorthand: ``, Kind: `string`, Description: `Scroll Desktop to this message ID after focusing`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `chats:focus`, Name: `draft`, Shorthand: ``, Kind: `string`, Description: `Prefill the chat composer with this draft text`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `chats:focus`, Name: `attachment`, Shorthand: ``, Kind: `string`, Description: `Prefill the chat composer with this attachment file path`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `chats:list`, Name: `account`, Shorthand: ``, Kind: `string`, Description: `Limit to account selector`, Required: false, Multiple: true, DefaultTrue: false},
	{Command: `chats:list`, Name: `ids`, Shorthand: ``, Kind: `boolean`, Description: `Print preferred chat selectors, using numeric local chat IDs when available`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `chats:list`, Name: `limit`, Shorthand: ``, Kind: `integer`, Description: `Maximum chats to print`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `chats:list`, Name: `archived`, Shorthand: ``, Kind: `boolean`, Description: `Only archived chats (--no-archived to exclude)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `chats:list`, Name: `pinned`, Shorthand: ``, Kind: `boolean`, Description: `Only pinned chats (--no-pinned to exclude)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `chats:list`, Name: `muted`, Shorthand: ``, Kind: `boolean`, Description: `Only muted chats (--no-muted to exclude)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `chats:list`, Name: `unread`, Shorthand: ``, Kind: `boolean`, Description: `Only chats with unread messages (--no-unread to exclude)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `chats:list`, Name: `low-priority`, Shorthand: ``, Kind: `boolean`, Description: `Only Low Priority chats (--no-low-priority to exclude)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `chats:mark-read`, Name: `chat`, Shorthand: ``, Kind: `string`, Description: `Chat selector (ID, local ID, title, or search text)`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `chats:mark-unread`, Name: `chat`, Shorthand: ``, Kind: `string`, Description: `Chat selector (ID, local ID, title, or search text)`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `chats:mute`, Name: `chat`, Shorthand: ``, Kind: `string`, Description: `Chat selector (ID, local ID, title, or search text)`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `chats:mute`, Name: `pick`, Shorthand: ``, Kind: `integer`, Description: `Pick the Nth result when the selector is ambiguous (1-indexed)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `chats:notify-anyway`, Name: `chat`, Shorthand: ``, Kind: `string`, Description: `Chat selector (ID, local ID, title, or search text)`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `chats:pin`, Name: `chat`, Shorthand: ``, Kind: `string`, Description: `Chat selector (ID, local ID, title, or search text)`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `chats:priority`, Name: `chat`, Shorthand: ``, Kind: `string`, Description: `Chat selector (ID, local ID, title, or search text)`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `chats:priority`, Name: `pick`, Shorthand: ``, Kind: `integer`, Description: `Pick the Nth result when the selector is ambiguous (1-indexed)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `chats:priority`, Name: `level`, Shorthand: ``, Kind: `string`, Description: `Destination: inbox (default mailbox) or low (Low Priority)`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `chats:remind`, Name: `chat`, Shorthand: ``, Kind: `string`, Description: `Chat selector (ID, local ID, title, or search text)`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `chats:rename`, Name: `chat`, Shorthand: ``, Kind: `string`, Description: `Chat selector (ID, local ID, title, or search text)`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `chats:rename`, Name: `pick`, Shorthand: ``, Kind: `integer`, Description: `Pick the Nth result when the selector is ambiguous (1-indexed)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `chats:rename`, Name: `title`, Shorthand: ``, Kind: `string`, Description: `New chat title`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `chats:search`, Name: `account`, Shorthand: ``, Kind: `string`, Description: `Limit to Account ID, network, bridge, or account user`, Required: false, Multiple: true, DefaultTrue: false},
	{Command: `chats:search`, Name: `ids`, Shorthand: ``, Kind: `boolean`, Description: `Print preferred chat selectors, using numeric local chat IDs when available`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `chats:search`, Name: `limit`, Shorthand: ``, Kind: `integer`, Description: `Maximum chats to print`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `chats:show`, Name: `chat`, Shorthand: ``, Kind: `string`, Description: `Chat selector (ID, local ID, title, or search text)`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `chats:start`, Name: `account`, Shorthand: ``, Kind: `string`, Description: `Account selector. Defaults to the single available account or the matrix account.`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `chats:start`, Name: `title`, Shorthand: ``, Kind: `string`, Description: `Optional initial title for a new group chat`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `chats:unarchive`, Name: `chat`, Shorthand: ``, Kind: `string`, Description: `Chat selector (ID, local ID, title, or search text)`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `chats:unmute`, Name: `chat`, Shorthand: ``, Kind: `string`, Description: `Chat selector (ID, local ID, title, or search text)`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `chats:unpin`, Name: `chat`, Shorthand: ``, Kind: `string`, Description: `Chat selector (ID, local ID, title, or search text)`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `chats:unremind`, Name: `chat`, Shorthand: ``, Kind: `string`, Description: `Chat selector (ID, local ID, title, or search text)`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `completion`, Name: `refresh-cache`, Shorthand: `r`, Kind: `boolean`, Description: `Refresh the autocomplete cache before printing setup`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `completion`, Name: `semantic`, Shorthand: ``, Kind: `boolean`, Description: `Print a semantic-completion snippet (chats/accounts/targets) for bash or zsh`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `contacts`, Name: `ids`, Shorthand: ``, Kind: `boolean`, Description: `Print only contact user IDs`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `contacts`, Name: `limit`, Shorthand: ``, Kind: `integer`, Description: `Maximum contacts to print`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `contacts`, Name: `account`, Shorthand: ``, Kind: `string`, Description: `Limit to account selector`, Required: false, Multiple: true, DefaultTrue: false},
	{Command: `contacts`, Name: `query`, Shorthand: ``, Kind: `string`, Description: `Optional blended contact lookup query`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `contacts:list`, Name: `ids`, Shorthand: ``, Kind: `boolean`, Description: `Print only contact user IDs`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `contacts:list`, Name: `limit`, Shorthand: ``, Kind: `integer`, Description: `Maximum contacts to print`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `contacts:list`, Name: `account`, Shorthand: ``, Kind: `string`, Description: `Limit to account selector`, Required: false, Multiple: true, DefaultTrue: false},
	{Command: `contacts:list`, Name: `query`, Shorthand: ``, Kind: `string`, Description: `Optional blended contact lookup query`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `contacts:search`, Name: `account`, Shorthand: ``, Kind: `string`, Description: `Account selector. Omit to search every account.`, Required: false, Multiple: true, DefaultTrue: false},
	{Command: `contacts:show`, Name: `account`, Shorthand: ``, Kind: `string`, Description: `Limit to account ID, network, bridge, or account user`, Required: false, Multiple: true, DefaultTrue: false},
	{Command: `export`, Name: `account`, Shorthand: ``, Kind: `string`, Description: `Limit to an account selector. Repeat to include more accounts.`, Required: false, Multiple: true, DefaultTrue: false},
	{Command: `export`, Name: `chat`, Shorthand: ``, Kind: `string`, Description: `Limit to a chat selector. Repeat to include more chats.`, Required: false, Multiple: true, DefaultTrue: false},
	{Command: `export`, Name: `force`, Shorthand: ``, Kind: `boolean`, Description: `Re-export chats even if checkpoint state says they are complete.`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `export`, Name: `limit-chats`, Shorthand: ``, Kind: `integer`, Description: `Maximum chats to export. Intended for testing large exports.`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `export`, Name: `limit-messages`, Shorthand: ``, Kind: `integer`, Description: `Maximum messages per chat. Intended for testing large exports.`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `export`, Name: `max-participants`, Shorthand: ``, Kind: `integer`, Description: `Maximum participants to include in each chat.json.`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `export`, Name: `no-attachments`, Shorthand: ``, Kind: `boolean`, Description: `Skip downloading message attachments.`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `export`, Name: `out`, Shorthand: `o`, Kind: `directory`, Description: `Export directory.`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `export`, Name: `pick`, Shorthand: ``, Kind: `integer`, Description: `Pick the Nth result when the selector is ambiguous (1-indexed)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `export`, Name: `quiet`, Shorthand: ``, Kind: `boolean`, Description: `Suppress progress output.`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `install:desktop`, Name: `channel`, Shorthand: ``, Kind: `string`, Description: `Desktop release channel`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `install:server`, Name: `channel`, Shorthand: ``, Kind: `string`, Description: `Server release channel`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `install:server`, Name: `server-env`, Shorthand: ``, Kind: `string`, Description: `Server environment. Staging forces nightly.`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `media:download`, Name: `out`, Shorthand: `o`, Kind: `string`, Description: `Output directory; pass - to stream the file to stdout`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `messages:context`, Name: `chat`, Shorthand: ``, Kind: `string`, Description: `Chat selector (ID, local ID, title, or search text)`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `messages:context`, Name: `id`, Shorthand: ``, Kind: `string`, Description: `Target message ID to center the window on`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `messages:context`, Name: `before`, Shorthand: ``, Kind: `integer`, Description: `Number of messages to include before the target`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `messages:context`, Name: `after`, Shorthand: ``, Kind: `integer`, Description: `Number of messages to include after the target`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `messages:context`, Name: `pick`, Shorthand: ``, Kind: `integer`, Description: `Pick the Nth result when the selector is ambiguous (1-indexed)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `messages:delete`, Name: `chat`, Shorthand: ``, Kind: `string`, Description: `Chat selector (ID, local ID, title, or search text)`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `messages:delete`, Name: `id`, Shorthand: ``, Kind: `string`, Description: `Message ID to delete (final message ID; pending IDs are rejected)`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `messages:delete`, Name: `pick`, Shorthand: ``, Kind: `integer`, Description: `Pick the Nth result when the selector is ambiguous (1-indexed)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `messages:delete`, Name: `for-everyone`, Shorthand: ``, Kind: `boolean`, Description: `Delete for everyone when the network supports it (otherwise deletes only for you)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `messages:edit`, Name: `chat`, Shorthand: ``, Kind: `string`, Description: `Chat selector (ID, local ID, title, or search text)`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `messages:edit`, Name: `id`, Shorthand: ``, Kind: `string`, Description: `Message ID to edit (must be one of your own messages with no attachments)`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `messages:edit`, Name: `pick`, Shorthand: ``, Kind: `integer`, Description: `Pick the Nth result when the selector is ambiguous (1-indexed)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `messages:edit`, Name: `message`, Shorthand: ``, Kind: `string`, Description: `New message text`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `messages:list`, Name: `chat`, Shorthand: ``, Kind: `string`, Description: `Chat selector (ID, local ID, title, or search text)`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `messages:list`, Name: `before-cursor`, Shorthand: ``, Kind: `string`, Description: `Paginate messages older than this message ID`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `messages:list`, Name: `after-cursor`, Shorthand: ``, Kind: `string`, Description: `Paginate messages newer than this message ID`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `messages:list`, Name: `sender`, Shorthand: ``, Kind: `string`, Description: `Filter by sender: me, others, or a specific user ID (client-side)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `messages:list`, Name: `asc`, Shorthand: ``, Kind: `boolean`, Description: `Order oldest first (default: newest first)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `messages:list`, Name: `ids`, Shorthand: ``, Kind: `boolean`, Description: `Print only message IDs`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `messages:list`, Name: `limit`, Shorthand: ``, Kind: `integer`, Description: `Maximum messages to print`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `messages:list`, Name: `pick`, Shorthand: ``, Kind: `integer`, Description: `Pick the Nth result when the selector is ambiguous (1-indexed)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `messages:search`, Name: `account`, Shorthand: ``, Kind: `string`, Description: `Limit to an account selector. Repeat for multiple.`, Required: false, Multiple: true, DefaultTrue: false},
	{Command: `messages:search`, Name: `chat`, Shorthand: ``, Kind: `string`, Description: `Limit to a chat selector. Repeat for multiple.`, Required: false, Multiple: true, DefaultTrue: false},
	{Command: `messages:search`, Name: `chat-type`, Shorthand: ``, Kind: `string`, Description: `Only group chats or direct messages`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `messages:search`, Name: `after`, Shorthand: ``, Kind: `string`, Description: `Only messages at or after this ISO timestamp`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `messages:search`, Name: `before`, Shorthand: ``, Kind: `string`, Description: `Only messages at or before this ISO timestamp`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `messages:search`, Name: `exclude-low-priority`, Shorthand: ``, Kind: `boolean`, Description: `Exclude low-priority chats`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `messages:search`, Name: `ids`, Shorthand: ``, Kind: `boolean`, Description: `Print only message IDs`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `messages:search`, Name: `include-muted`, Shorthand: ``, Kind: `boolean`, Description: `Include muted chats`, Required: false, Multiple: false, DefaultTrue: true},
	{Command: `messages:search`, Name: `limit`, Shorthand: ``, Kind: `integer`, Description: `Maximum results`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `messages:search`, Name: `media`, Shorthand: ``, Kind: `string`, Description: `Filter by media type. Repeat for multiple.`, Required: false, Multiple: true, DefaultTrue: false},
	{Command: `messages:search`, Name: `sender`, Shorthand: ``, Kind: `string`, Description: `me, others, or a user ID`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `messages:show`, Name: `chat`, Shorthand: ``, Kind: `string`, Description: `Chat selector (ID, local ID, title, or search text)`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `messages:show`, Name: `id`, Shorthand: ``, Kind: `string`, Description: `Message ID, pendingMessageID, or Matrix event ID`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `messages:show`, Name: `pick`, Shorthand: ``, Kind: `integer`, Description: `Pick the Nth result when the selector is ambiguous (1-indexed)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `presence`, Name: `chat`, Shorthand: ``, Kind: `string`, Description: `Chat selector (ID, local ID, title, or search text)`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `presence`, Name: `pick`, Shorthand: ``, Kind: `integer`, Description: `Pick the Nth result when the selector is ambiguous (1-indexed)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `presence`, Name: `state`, Shorthand: ``, Kind: `string`, Description: `Indicator to send`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `presence`, Name: `duration`, Shorthand: ``, Kind: `integer`, Description: `When --state is typing, send paused automatically after this many seconds`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `send:react`, Name: `to`, Shorthand: ``, Kind: `string`, Description: `Chat selector (ID, local ID, title, or search text)`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `send:react`, Name: `id`, Shorthand: ``, Kind: `string`, Description: `Message ID to react to`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `send:react`, Name: `reaction`, Shorthand: ``, Kind: `string`, Description: `Reaction key (emoji, shortcode, or custom emoji key)`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `send:react`, Name: `pick`, Shorthand: ``, Kind: `integer`, Description: `Pick the Nth result when the selector is ambiguous (1-indexed)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `send:react`, Name: `transaction`, Shorthand: ``, Kind: `string`, Description: `Optional transaction ID for deduplication`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `send:sticker`, Name: `to`, Shorthand: ``, Kind: `string`, Description: `Chat selector (ID, local ID, title, or search text)`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `send:sticker`, Name: `file`, Shorthand: ``, Kind: `string`, Description: `Sticker file (typically 512x512 WebP)`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `send:sticker`, Name: `filename`, Shorthand: ``, Kind: `string`, Description: `Override the displayed filename`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `send:sticker`, Name: `mime`, Shorthand: ``, Kind: `string`, Description: `MIME type for the sticker (default: image/webp)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `send:sticker`, Name: `pick`, Shorthand: ``, Kind: `integer`, Description: `Pick the Nth result when the selector is ambiguous (1-indexed)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `send:sticker`, Name: `reply-to`, Shorthand: ``, Kind: `string`, Description: `Send as a reply to this message ID`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `send:sticker`, Name: `wait`, Shorthand: ``, Kind: `boolean`, Description: `Wait for the message to leave the pending state (or fail) before returning`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `send:sticker`, Name: `wait-timeout`, Shorthand: ``, Kind: `integer`, Description: `Maximum wait time in ms when --wait is set`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `send:unreact`, Name: `to`, Shorthand: ``, Kind: `string`, Description: `Chat selector (ID, local ID, title, or search text)`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `send:unreact`, Name: `id`, Shorthand: ``, Kind: `string`, Description: `Message ID whose reaction to remove`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `send:unreact`, Name: `reaction`, Shorthand: ``, Kind: `string`, Description: `Reaction key to remove (emoji, shortcode, or custom emoji key)`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `send:unreact`, Name: `pick`, Shorthand: ``, Kind: `integer`, Description: `Pick the Nth result when the selector is ambiguous (1-indexed)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `send:unreact`, Name: `transaction`, Shorthand: ``, Kind: `string`, Description: `Optional transaction ID for deduplication`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `send:voice`, Name: `to`, Shorthand: ``, Kind: `string`, Description: `Chat selector (ID, local ID, title, or search text)`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `send:voice`, Name: `file`, Shorthand: ``, Kind: `string`, Description: `Voice note audio file (OGG/Opus recommended)`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `send:voice`, Name: `duration`, Shorthand: ``, Kind: `integer`, Description: `Voice note duration in seconds (overrides upload-detected duration)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `send:voice`, Name: `filename`, Shorthand: ``, Kind: `string`, Description: `Override the displayed filename`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `send:voice`, Name: `mime`, Shorthand: ``, Kind: `string`, Description: `MIME type for the voice note (default: audio/ogg)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `send:voice`, Name: `pick`, Shorthand: ``, Kind: `integer`, Description: `Pick the Nth result when the selector is ambiguous (1-indexed)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `send:voice`, Name: `reply-to`, Shorthand: ``, Kind: `string`, Description: `Send as a reply to this message ID`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `send:voice`, Name: `wait`, Shorthand: ``, Kind: `boolean`, Description: `Wait for the message to leave the pending state (or fail) before returning`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `send:voice`, Name: `wait-timeout`, Shorthand: ``, Kind: `integer`, Description: `Maximum wait time in ms when --wait is set`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `setup`, Name: `local`, Shorthand: ``, Kind: `boolean`, Description: `Use the local Beeper Desktop session on this device`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `setup`, Name: `oauth`, Shorthand: ``, Kind: `boolean`, Description: `Authorize the target with browser OAuth/PKCE`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `setup`, Name: `remote`, Shorthand: ``, Kind: `string`, Description: `Connect to a remote Beeper Desktop or Server URL`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `setup`, Name: `server`, Shorthand: ``, Kind: `boolean`, Description: `Set up a local Beeper Server target`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `setup`, Name: `desktop`, Shorthand: ``, Kind: `boolean`, Description: `Set up a local Beeper Desktop target`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `setup`, Name: `install`, Shorthand: ``, Kind: `boolean`, Description: `Allow installing missing managed runtime`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `setup`, Name: `channel`, Shorthand: ``, Kind: `string`, Description: `Install release channel`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `setup`, Name: `server-env`, Shorthand: ``, Kind: `string`, Description: `Server environment. Staging forces nightly.`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `setup`, Name: `email`, Shorthand: ``, Kind: `string`, Description: `Sign in with an email address`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `setup`, Name: `username`, Shorthand: ``, Kind: `string`, Description: `Username to use if setup creates a new account`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `targets:add:desktop`, Name: `port`, Shorthand: ``, Kind: `integer`, Description: `TCP port the managed Desktop will expose its API on`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `targets:add:desktop`, Name: `default`, Shorthand: ``, Kind: `boolean`, Description: `Set this target as the default after creation`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `targets:add:desktop`, Name: `server-env`, Shorthand: ``, Kind: `string`, Description: `Server environment. Staging forces nightly.`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `targets:add:remote`, Name: `default`, Shorthand: ``, Kind: `boolean`, Description: `Set this target as the default after creation`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `targets:add:server`, Name: `port`, Shorthand: ``, Kind: `integer`, Description: `TCP port the managed Server will expose its API on`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `targets:add:server`, Name: `default`, Shorthand: ``, Kind: `boolean`, Description: `Set this target as the default after creation`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `targets:add:server`, Name: `server-env`, Shorthand: ``, Kind: `string`, Description: `Server environment. Staging forces nightly.`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `targets:logs`, Name: `lines`, Shorthand: ``, Kind: `integer`, Description: `Lines to print from each log file`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `targets:logs`, Name: `files`, Shorthand: ``, Kind: `integer`, Description: `Desktop log files to print, newest first`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `targets:logs`, Name: `all`, Shorthand: ``, Kind: `boolean`, Description: `Print all matching log files instead of only recent files`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `update`, Name: `cli`, Shorthand: ``, Kind: `boolean`, Description: `Check the Beeper CLI package`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `update`, Name: `desktop`, Shorthand: ``, Kind: `boolean`, Description: `Check the CLI-owned Desktop install`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `update`, Name: `server`, Shorthand: ``, Kind: `boolean`, Description: `Check the CLI-owned Server install`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `update`, Name: `check`, Shorthand: ``, Kind: `boolean`, Description: `Only check for updates; do not install`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `verify`, Name: `user`, Shorthand: ``, Kind: `string`, Description: `User ID to verify against (defaults to your own account)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `verify:approve`, Name: `id`, Shorthand: ``, Kind: `string`, Description: `Verification request ID. Defaults to the active request.`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `verify:cancel`, Name: `id`, Shorthand: ``, Kind: `string`, Description: `Verification request ID. Defaults to the active request.`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `verify:qr-confirm`, Name: `id`, Shorthand: ``, Kind: `string`, Description: `Verification request ID. Defaults to the active request.`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `verify:qr-scan`, Name: `id`, Shorthand: ``, Kind: `string`, Description: `Verification request ID. Defaults to the active request.`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `verify:qr-scan`, Name: `payload`, Shorthand: ``, Kind: `string`, Description: `Raw QR-code data scanned from the other device`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `verify:recovery-key`, Name: `key`, Shorthand: ``, Kind: `string`, Description: `Recovery key string`, Required: true, Multiple: false, DefaultTrue: false},
	{Command: `verify:sas`, Name: `id`, Shorthand: ``, Kind: `string`, Description: `Verification request ID. Defaults to the active request.`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `verify:sas-confirm`, Name: `id`, Shorthand: ``, Kind: `string`, Description: `Verification request ID. Defaults to the active request.`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `verify:start`, Name: `user`, Shorthand: ``, Kind: `string`, Description: `User ID to verify with (defaults to your own account)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `watch`, Name: `chat`, Shorthand: `c`, Kind: `string`, Description: `Chat ID to subscribe to. Defaults to all chats.`, Required: false, Multiple: true, DefaultTrue: false},
	{Command: `watch`, Name: `json`, Shorthand: ``, Kind: `boolean`, Description: `Print raw JSON, one event per line`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `watch`, Name: `include-type`, Shorthand: ``, Kind: `string`, Description: `Only forward events of these types. Repeat for multiple.`, Required: false, Multiple: true, DefaultTrue: false},
	{Command: `watch`, Name: `exclude-type`, Shorthand: ``, Kind: `string`, Description: `Drop events of these types. Repeat for multiple.`, Required: false, Multiple: true, DefaultTrue: false},
	{Command: `watch`, Name: `webhook`, Shorthand: ``, Kind: `string`, Description: `Forward each event to this URL as a POST request (best-effort, fire-and-forget)`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `watch`, Name: `webhook-secret`, Shorthand: ``, Kind: `string`, Description: `HMAC-SHA256 secret. Signs payloads with X-Beeper-Signature: sha256=<hex>`, Required: false, Multiple: false, DefaultTrue: false},
	{Command: `watch`, Name: `webhook-queue`, Shorthand: ``, Kind: `integer`, Description: `Maximum pending webhook deliveries before dropping events`, Required: false, Multiple: false, DefaultTrue: false},
}

var generatedArgSpecs = []argSpec{
	{Command: `accounts:add`, Name: `bridge`, Description: `Bridge ID, network, or type to connect. Omit to list available bridges.`, Required: false},
	{Command: `accounts:remove`, Name: `account`, Description: `Account selector (ID, network, bridge, or user identity)`, Required: true},
	{Command: `accounts:show`, Name: `account`, Description: `Account selector (ID, network, bridge, or user identity)`, Required: true},
	{Command: `bridges:show`, Name: `bridge`, Description: `Bridge ID, display name, network, or type`, Required: true},
	{Command: `chats:search`, Name: `query`, Description: `Search query (title, participant, or network)`, Required: true},
	{Command: `chats:start`, Name: `user`, Description: `User ID, phone number, email, or display name`, Required: true},
	{Command: `completion`, Name: `shell`, Description: `Shell to set up (bash, zsh, fish, or powershell)`, Required: false},
	{Command: `config:get`, Name: `key`, Description: `Optional config key to print`, Required: false},
	{Command: `config:set`, Name: `key`, Description: `Config key to set`, Required: true},
	{Command: `config:set`, Name: `value`, Description: `Config value (pass "" to clear)`, Required: true},
	{Command: `contacts:search`, Name: `query`, Description: `Contact search query`, Required: true},
	{Command: `contacts:show`, Name: `id`, Description: `Contact user ID, display name, or phone/handle`, Required: true},
	{Command: `media:download`, Name: `url`, Description: `mxc:// or localmxc:// URL`, Required: true},
	{Command: `messages:search`, Name: `query`, Description: `Search text (literal word match)`, Required: false},
	{Command: `targets:add:desktop`, Name: `name`, Description: `Target name (default: "desktop")`, Required: false},
	{Command: `targets:add:remote`, Name: `name`, Description: `Local name for the target`, Required: true},
	{Command: `targets:add:remote`, Name: `url`, Description: `Base URL of the remote Desktop or Server API`, Required: true},
	{Command: `targets:add:server`, Name: `name`, Description: `Target name (default: "server")`, Required: false},
	{Command: `targets:disable`, Name: `name`, Description: `Target name. Defaults to the selected target.`, Required: false},
	{Command: `targets:enable`, Name: `name`, Description: `Target name. Defaults to the selected target.`, Required: false},
	{Command: `targets:logs`, Name: `name`, Description: `Target name. Defaults to the selected target.`, Required: false},
	{Command: `targets:remove`, Name: `name`, Description: `Target name`, Required: true},
	{Command: `targets:restart`, Name: `name`, Description: `Target name. Defaults to the selected target.`, Required: false},
	{Command: `targets:show`, Name: `name`, Description: `Target name. Defaults to the selected target.`, Required: false},
	{Command: `targets:start`, Name: `name`, Description: `Target name. Defaults to the selected target.`, Required: false},
	{Command: `targets:status`, Name: `name`, Description: `Target name. Defaults to the selected target.`, Required: false},
	{Command: `targets:stop`, Name: `name`, Description: `Target name. Defaults to the selected target.`, Required: false},
	{Command: `targets:use`, Name: `name`, Description: `Target name`, Required: true},
}

func registerGeneratedCommands(root *cobra.Command, opts *globalOptions) {
	nodes := map[string]*cobra.Command{"": root}
	var ensureNode func(path string) *cobra.Command
	ensureNode = func(path string) *cobra.Command {
		if cmd := nodes[path]; cmd != nil {
			return cmd
		}
		parts := splitCommandPath(path)
		parentPath := joinCommandPath(parts[:len(parts)-1])
		parent := nodes[parentPath]
		if parent == nil {
			parent = ensureNode(parentPath)
		}
		cmd := &cobra.Command{Use: parts[len(parts)-1], Short: parts[len(parts)-1]}
		parent.AddCommand(cmd)
		nodes[path] = cmd
		return cmd
	}
	for _, spec := range generatedCommandSpecs {
		if spec.Name == "completion" || spec.Name == "version" || spec.Name == "autocomplete" {
			continue
		}
		cmd := ensureNode(spec.Name)
		cmd.Short = firstNonEmpty(spec.Summary, spec.Name)
		cmd.Long = firstNonEmpty(spec.Description, spec.Summary)
		addGeneratedFlags(cmd, spec)
		cmd.RunE = runGeneratedCommand(opts, spec)
	}
}

func addGeneratedFlags(cmd *cobra.Command, spec commandSpec) {
	switch {
	case spec.Name == "accounts" || spec.Name == "accounts:list" || spec.Name == "accounts:show" || spec.Name == "accounts:use" || spec.Name == "accounts:remove" || spec.Name == "contacts" || spec.Name == "contacts:list" || spec.Name == "contacts:search" || spec.Name == "contacts:show":
		addAccountFlags(cmd, spec)
	case spec.Name == "chats" || spec.Name == "chats:list" || spec.Name == "accounts:chats" || spec.Name == "chats:show" || spec.Name == "chats:search" || spec.Name == "chats:archive" || spec.Name == "chats:unarchive" || spec.Name == "chats:avatar" || spec.Name == "chats:description" || spec.Name == "chats:disappear" || spec.Name == "chats:draft" || spec.Name == "chats:mark-read" || spec.Name == "chats:mark-unread" || spec.Name == "chats:mute" || spec.Name == "chats:unmute" || spec.Name == "chats:notify-anyway" || spec.Name == "chats:pin" || spec.Name == "chats:unpin" || spec.Name == "chats:priority" || spec.Name == "chats:remind" || spec.Name == "chats:unremind" || spec.Name == "chats:rename" || spec.Name == "chats:start" || spec.Name == "chats:focus":
		addChatFlags(cmd, spec)
	case spec.Name == "messages:list" || spec.Name == "messages:search" || spec.Name == "messages:show" || spec.Name == "messages:context" || spec.Name == "messages:export" || spec.Name == "messages:delete" || spec.Name == "messages:edit" || spec.Name == "send:text" || spec.Name == "send:file" || spec.Name == "send:sticker" || spec.Name == "send:voice" || spec.Name == "send:react" || spec.Name == "send:unreact":
		addMessageFlags(cmd, spec)
	case spec.Name == "media:download":
		addMediaFlags(cmd, spec)
	case spec.Name == "presence":
		addPresenceFlags(cmd, spec)
	case spec.Name == "targets:tunnel":
		addTunnelFlags(cmd)
	}
	addBaselineFlags(cmd, spec)
	for _, arg := range generatedArgSpecs {
		if arg.Command == spec.Name {
			cmd.Use += " [" + arg.Name + "]"
		}
	}
}

func addBaselineFlags(cmd *cobra.Command, spec commandSpec) {
	for _, flag := range generatedFlagSpecs {
		if flag.Command != spec.Name || cmd.Flags().Lookup(flag.Name) != nil || cmd.Root().PersistentFlags().Lookup(flag.Name) != nil {
			continue
		}
		desc := flag.Description
		if desc == "" {
			desc = flag.Name
		}
		switch flag.Kind {
		case "boolean":
			value := flag.DefaultTrue
			if flag.Shorthand != "" {
				cmd.Flags().BoolP(flag.Name, flag.Shorthand, value, desc)
			} else {
				cmd.Flags().Bool(flag.Name, value, desc)
			}
		case "integer":
			if flag.Shorthand != "" {
				cmd.Flags().IntP(flag.Name, flag.Shorthand, 0, desc)
			} else {
				cmd.Flags().Int(flag.Name, 0, desc)
			}
		default:
			if flag.Multiple {
				if flag.Shorthand != "" {
					cmd.Flags().StringArrayP(flag.Name, flag.Shorthand, nil, desc)
				} else {
					cmd.Flags().StringArray(flag.Name, nil, desc)
				}
			} else if flag.Shorthand != "" {
				cmd.Flags().StringP(flag.Name, flag.Shorthand, "", desc)
			} else {
				cmd.Flags().String(flag.Name, "", desc)
			}
		}
		if flag.Required {
			_ = cmd.MarkFlagRequired(flag.Name)
		}
	}
}

func runGeneratedCommand(opts *globalOptions, spec commandSpec) func(*cobra.Command, []string) error {
	return func(cmd *cobra.Command, args []string) error {
		if spec.Write && !commandAllowsReadOnlyWrite(spec, cmd) {
			if err := ensureWritable(opts); err != nil {
				return err
			}
		}
		return runCommand(opts, spec, cmd, args)
	}
}

func commandAllowsReadOnlyWrite(spec commandSpec, cmd *cobra.Command) bool {
	if spec.Name != "update" {
		return false
	}
	check, _ := cmd.Flags().GetBool("check")
	return check
}

func splitCommandPath(path string) []string {
	if path == "" {
		return nil
	}
	out := []string{}
	start := 0
	for i, r := range path {
		if r == ':' {
			out = append(out, path[start:i])
			start = i + 1
		}
	}
	return append(out, path[start:])
}

func joinCommandPath(parts []string) string {
	if len(parts) == 0 {
		return ""
	}
	out := parts[0]
	for _, part := range parts[1:] {
		out += ":" + part
	}
	return out
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}
	return ""
}
