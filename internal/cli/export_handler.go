package cli

import (
	"context"
	"encoding/json"
	"html"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	beeperdesktopapi "github.com/beeper/desktop-api-go/v5"
	"github.com/beeper/desktop-api-go/v5/packages/param"
	"github.com/beeper/desktop-api-go/v5/shared"
	"github.com/spf13/cobra"
)

func runExportCommand(opts *globalOptions, cmd *cobra.Command, args []string) error {
	client, ctx, cancel, err := newClient(opts)
	if err != nil {
		return err
	}
	defer cancel()
	out := firstFlag(cmd, "out")
	if out == "" {
		out = "beeper-export"
	}
	if err := os.MkdirAll(out, 0o755); err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Join(out, "chats"), 0o755); err != nil {
		return err
	}
	accounts, err := client.Accounts.List(ctx)
	if err != nil {
		return err
	}
	if err := writeJSONFile(filepath.Join(out, "accounts.json"), accounts); err != nil {
		return err
	}
	accountFilters, _ := cmd.Flags().GetStringArray("account")
	accountIDs := []string{}
	for _, selector := range accountFilters {
		id, err := resolveAccountID(ctx, client, selector)
		if err != nil {
			return err
		}
		accountIDs = append(accountIDs, id)
	}
	chatFilters, _ := cmd.Flags().GetStringArray("chat")
	limitChats, _ := cmd.Flags().GetInt("limit-chats")
	limitMessages, _ := cmd.Flags().GetInt("limit-messages")
	maxParticipants, _ := cmd.Flags().GetInt("max-participants")
	downloadAttachments, _ := cmd.Flags().GetBool("no-attachments")
	downloadAttachments = !downloadAttachments
	force, _ := cmd.Flags().GetBool("force")
	quiet, _ := cmd.Flags().GetBool("quiet")
	statePath := filepath.Join(out, ".beeper-export-state.json")
	state := exportState{Chats: map[string]exportChatState{}, CreatedAt: time.Now().UTC().Format(time.RFC3339), ExportVersion: 1}
	if !force {
		_ = readJSONFile(statePath, &state)
		if state.Chats == nil {
			state.Chats = map[string]exportChatState{}
		}
	}
	params := beeperdesktopapi.ChatListParams{}
	if len(accountIDs) > 0 {
		params.AccountIDs = accountIDs
	}
	chats := []beeperdesktopapi.ChatListResponse{}
	if len(chatFilters) > 0 {
		for _, selector := range chatFilters {
			pick, _ := cmd.Flags().GetInt("pick")
			chatID, err := resolveChatID(ctx, client, selector, pick)
			if err != nil {
				return err
			}
			chat, err := client.Chats.Get(ctx, chatID, beeperdesktopapi.ChatGetParams{MaxParticipantCount: param.NewOpt(int64(maxParticipants))})
			if err != nil {
				return err
			}
			chats = append(chats, chatToListResponse(*chat))
		}
	} else {
		pager := client.Chats.ListAutoPaging(ctx, params)
		for pager.Next() {
			chats = append(chats, pager.Current())
			if limitChats > 0 && len(chats) >= limitChats {
				break
			}
		}
		if err := pager.Err(); err != nil {
			return err
		}
	}
	messageCount := 0
	attachmentCount := 0
	for index, chat := range chats {
		dir := filepath.Join(out, "chats", sanitizePathComponent(chat.ID))
		if !force && state.Chats[chat.ID].Complete {
			messageCount += state.Chats[chat.ID].MessageCount
			attachmentCount += state.Chats[chat.ID].AttachmentCount
			continue
		}
		if !quiet {
			progressEvent(opts, "export.progress", map[string]any{"message": "exporting chat " + strconv.Itoa(index+1) + "/" + strconv.Itoa(len(chats)), "chatID": chat.ID})
		}
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return err
		}
		if err := os.MkdirAll(filepath.Join(dir, "attachments"), 0o755); err != nil {
			return err
		}
		fullChat, err := client.Chats.Get(ctx, chat.ID, beeperdesktopapi.ChatGetParams{MaxParticipantCount: param.NewOpt(int64(maxParticipants))})
		if err != nil {
			return err
		}
		if err := writeJSONFile(filepath.Join(dir, "chat.json"), fullChat); err != nil {
			return err
		}
		state.Chats[chat.ID] = exportChatState{Complete: false, StartedAt: time.Now().UTC().Format(time.RFC3339), UpdatedAt: time.Now().UTC().Format(time.RFC3339)}
		_ = writeJSONFile(statePath, state)
		messages, err := collectMessages(ctx, client, chat.ID, beeperdesktopapi.MessageListParams{}, limitMessages)
		if err != nil {
			return err
		}
		sort.Slice(messages, func(i, j int) bool { return messages[i].Timestamp.Before(messages[j].Timestamp) })
		attachments := []attachmentExport{}
		if downloadAttachments {
			attachments, err = downloadExportAttachments(ctx, client, dir, messages)
			if err != nil {
				return err
			}
			if err := writeJSONLFile(filepath.Join(dir, "attachments", "attachments.jsonl"), attachments); err != nil {
				return err
			}
		}
		messageCount += len(messages)
		attachmentCount += len(attachments)
		if err := writeJSONFile(filepath.Join(dir, "messages.json"), messages); err != nil {
			return err
		}
		if err := os.WriteFile(filepath.Join(dir, "messages.markdown"), []byte(renderExportMarkdown(*fullChat, messages, attachments)), 0o600); err != nil {
			return err
		}
		if err := os.WriteFile(filepath.Join(dir, "messages.html"), []byte(renderExportHTML(*fullChat, messages, attachments)), 0o600); err != nil {
			return err
		}
		state.Chats[chat.ID] = exportChatState{
			AttachmentCount: len(attachments),
			Complete:        true,
			MessageCount:    len(messages),
			StartedAt:       state.Chats[chat.ID].StartedAt,
			UpdatedAt:       time.Now().UTC().Format(time.RFC3339),
		}
		state.CompletedChatIDs = appendUnique(state.CompletedChatIDs, chat.ID)
		_ = writeJSONFile(statePath, state)
	}
	if err := writeJSONFile(filepath.Join(out, "chats.json"), chats); err != nil {
		return err
	}
	manifest := map[string]any{
		"exportedAt":      time.Now().UTC().Format(time.RFC3339),
		"accountCount":    len(*accounts),
		"chatCount":       len(chats),
		"messageCount":    messageCount,
		"attachmentCount": attachmentCount,
		"version":         1,
	}
	if err := writeJSONFile(filepath.Join(out, "manifest.json"), manifest); err != nil {
		return err
	}
	return printData(opts, manifest)
}

type exportState struct {
	CompletedChatIDs []string                   `json:"completedChatIDs"`
	CreatedAt        string                     `json:"createdAt"`
	ExportVersion    int                        `json:"exportVersion"`
	Chats            map[string]exportChatState `json:"chats"`
}

type exportChatState struct {
	AttachmentCount int    `json:"attachmentCount"`
	Complete        bool   `json:"complete"`
	MessageCount    int    `json:"messageCount"`
	StartedAt       string `json:"startedAt"`
	UpdatedAt       string `json:"updatedAt"`
}

type attachmentExport struct {
	Attachment shared.Attachment `json:"attachment"`
	Index      int               `json:"index"`
	Kind       string            `json:"kind"`
	MessageID  string            `json:"messageID"`
	Path       string            `json:"path"`
	SourceURL  string            `json:"sourceURL"`
}

func readJSONFile(path string, value any) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, value)
}

func writeJSONFile(path string, value any) error {
	data, err := json.MarshalIndent(value, "", "  ")
	if err != nil {
		return err
	}
	data = append(data, '\n')
	return os.WriteFile(path, data, 0o600)
}

func writeJSONLFile(path string, values []attachmentExport) error {
	var b strings.Builder
	for _, value := range values {
		data, err := json.Marshal(value)
		if err != nil {
			return err
		}
		b.Write(data)
		b.WriteByte('\n')
	}
	return os.WriteFile(path, []byte(b.String()), 0o600)
}

func sanitizePathComponent(value string) string {
	out := []rune(value)
	for i, r := range out {
		if r == '/' || r == ':' || r == '\\' || r == 0 {
			out[i] = '_'
		}
	}
	if string(out) == "" {
		return "chat"
	}
	return string(out)
}

func downloadExportAttachments(ctx context.Context, client beeperdesktopapi.Client, chatDir string, messages []shared.Message) ([]attachmentExport, error) {
	exports := []attachmentExport{}
	for _, message := range messages {
		for index, attachment := range message.Attachments {
			source := firstNonEmpty(attachment.ID, attachment.SrcURL)
			if source != "" {
				path, err := downloadExportURL(ctx, client, chatDir, source, message.ID, index, attachment.FileName, attachment.MimeType)
				if err != nil {
					return nil, err
				}
				exports = append(exports, attachmentExport{Attachment: attachment, Index: index, Kind: "attachment", MessageID: message.ID, Path: path, SourceURL: source})
			}
			if attachment.PosterImg != "" {
				path, err := downloadExportURL(ctx, client, chatDir, attachment.PosterImg, message.ID, index, "poster-"+attachment.FileName, "")
				if err != nil {
					return nil, err
				}
				exports = append(exports, attachmentExport{Attachment: attachment, Index: index, Kind: "poster", MessageID: message.ID, Path: path, SourceURL: attachment.PosterImg})
			}
		}
	}
	return exports, nil
}

func downloadExportURL(ctx context.Context, client beeperdesktopapi.Client, chatDir string, sourceURL string, messageID string, index int, fileName string, mimeType string) (string, error) {
	name := sanitizePathComponent(firstNonEmpty(fileName, fileNameFromURL(sourceURL, mimeType), "attachment"))
	rel := filepath.Join("attachments", sanitizePathComponent(messageID), fmtAttachmentName(index, name))
	dst := filepath.Join(chatDir, rel)
	if _, err := os.Stat(dst); err == nil {
		return rel, nil
	}
	if err := os.MkdirAll(filepath.Dir(dst), 0o755); err != nil {
		return "", err
	}
	var reader io.ReadCloser
	if strings.HasPrefix(sourceURL, "mxc://") || strings.HasPrefix(sourceURL, "localmxc://") || strings.HasPrefix(sourceURL, "file://") {
		res, err := client.Assets.Serve(ctx, beeperdesktopapi.AssetServeParams{URL: sourceURL})
		if err != nil {
			return "", err
		}
		if res.StatusCode < 200 || res.StatusCode >= 300 {
			res.Body.Close()
			return "", usageError("failed to download %s: HTTP %d", sourceURL, res.StatusCode)
		}
		reader = res.Body
	} else if strings.HasPrefix(sourceURL, "/") {
		file, err := os.Open(sourceURL)
		if err != nil {
			return "", err
		}
		reader = file
	} else {
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, sourceURL, nil)
		if err != nil {
			return "", err
		}
		res, err := http.DefaultClient.Do(req)
		if err != nil {
			return "", err
		}
		if res.StatusCode < 200 || res.StatusCode >= 300 {
			res.Body.Close()
			return "", usageError("failed to download %s: HTTP %d", sourceURL, res.StatusCode)
		}
		reader = res.Body
	}
	defer reader.Close()
	out, err := os.Create(dst)
	if err != nil {
		return "", err
	}
	defer out.Close()
	_, err = io.Copy(out, reader)
	return rel, err
}

func fmtAttachmentName(index int, name string) string {
	return strings.TrimLeft(strconv.Itoa(index+101), "1") + "-" + name
}

func fileNameFromURL(rawURL string, mimeType string) string {
	parts := strings.Split(rawURL, "/")
	if last := parts[len(parts)-1]; last != "" && !strings.Contains(last, ":") {
		return last
	}
	switch mimeType {
	case "image/jpeg":
		return "attachment.jpg"
	case "image/png":
		return "attachment.png"
	case "image/gif":
		return "attachment.gif"
	case "video/mp4":
		return "attachment.mp4"
	case "audio/mpeg":
		return "attachment.mp3"
	default:
		return "attachment"
	}
}

func renderExportMarkdown(chat beeperdesktopapi.Chat, messages []shared.Message, attachments []attachmentExport) string {
	byMessage := attachmentsByMessage(attachments)
	var b strings.Builder
	b.WriteString("# " + escapeMarkdown(firstNonEmpty(chat.Title, chat.ID)) + "\n\n")
	b.WriteString("- Chat ID: `" + chat.ID + "`\n")
	b.WriteString("- Account ID: `" + chat.AccountID + "`\n")
	b.WriteString("- Network: " + escapeMarkdown(chat.Network) + "\n")
	b.WriteString("- Type: " + string(chat.Type) + "\n")
	b.WriteString("- Messages: " + strconv.Itoa(len(messages)) + "\n\n")
	b.WriteString("## Messages\n\n")
	for _, message := range messages {
		sender := firstNonEmpty(message.SenderName, message.SenderID, "Unknown sender")
		b.WriteString("### " + escapeMarkdown(sender) + " - " + message.Timestamp.Format(time.RFC3339) + "\n\n")
		if message.Text != "" {
			b.WriteString(message.Text + "\n")
		}
		for _, item := range byMessage[message.ID] {
			label := firstNonEmpty(item.Attachment.FileName, item.Kind)
			b.WriteString("\n- [" + escapeMarkdown(label) + "](" + filepath.ToSlash(item.Path) + ")\n")
		}
		b.WriteString("\n")
	}
	return b.String()
}

func renderExportHTML(chat beeperdesktopapi.Chat, messages []shared.Message, attachments []attachmentExport) string {
	byMessage := attachmentsByMessage(attachments)
	var rows strings.Builder
	for _, message := range messages {
		sender := firstNonEmpty(message.SenderName, message.SenderID, "Unknown sender")
		rows.WriteString(`<article class="message">` + "\n")
		rows.WriteString(`<header><strong>` + html.EscapeString(sender) + `</strong><time datetime="` + html.EscapeString(message.Timestamp.Format(time.RFC3339)) + `">` + html.EscapeString(message.Timestamp.Format(time.RFC3339)) + `</time></header>` + "\n")
		if message.Text != "" {
			rows.WriteString(`<div class="body">` + strings.ReplaceAll(html.EscapeString(message.Text), "\n", "<br>") + `</div>` + "\n")
		}
		if items := byMessage[message.ID]; len(items) > 0 {
			rows.WriteString(`<ul class="attachments">`)
			for _, item := range items {
				label := firstNonEmpty(item.Attachment.FileName, item.Kind)
				rows.WriteString(`<li><a href="` + html.EscapeString(filepath.ToSlash(item.Path)) + `">` + html.EscapeString(label) + `</a></li>`)
			}
			rows.WriteString(`</ul>` + "\n")
		}
		rows.WriteString("</article>\n")
	}
	title := firstNonEmpty(chat.Title, chat.ID)
	return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>` + html.EscapeString(title) + `</title>
  <style>
    :root { color-scheme: light dark; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.45; margin: 0; color: CanvasText; background: Canvas; }
    main { max-width: 920px; margin: 0 auto; padding: 32px 20px; }
    h1 { font-size: 28px; margin: 0 0 8px; }
    .meta { color: color-mix(in srgb, CanvasText 70%, Canvas); display: grid; gap: 4px; margin: 0 0 28px; }
    .message { border-top: 1px solid color-mix(in srgb, CanvasText 18%, Canvas); padding: 16px 0; }
    header { display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: baseline; margin-bottom: 8px; }
    time { color: color-mix(in srgb, CanvasText 62%, Canvas); font-size: 13px; }
    .body { overflow-wrap: anywhere; }
    .attachments { margin: 10px 0 0; padding-left: 22px; }
    a { color: LinkText; }
  </style>
</head>
<body><main>
  <h1>` + html.EscapeString(title) + `</h1>
  <section class="meta">
    <span>Chat ID: <code>` + html.EscapeString(chat.ID) + `</code></span>
    <span>Account ID: <code>` + html.EscapeString(chat.AccountID) + `</code></span>
    <span>Network: ` + html.EscapeString(chat.Network) + `</span>
    <span>Type: ` + html.EscapeString(string(chat.Type)) + `</span>
    <span>Messages: ` + strconv.Itoa(len(messages)) + `</span>
  </section>
  <section class="messages">
` + rows.String() + `  </section>
</main></body></html>
`
}

func attachmentsByMessage(attachments []attachmentExport) map[string][]attachmentExport {
	out := map[string][]attachmentExport{}
	for _, attachment := range attachments {
		out[attachment.MessageID] = append(out[attachment.MessageID], attachment)
	}
	return out
}

func escapeMarkdown(value string) string {
	replacer := strings.NewReplacer("\\", "\\\\", "`", "\\`", "*", "\\*", "_", "\\_", "{", "\\{", "}", "\\}", "[", "\\[", "]", "\\]", "(", "\\(", ")", "\\)", "#", "\\#", "+", "\\+", "-", "\\-", ".", "\\.", "!", "\\!")
	return replacer.Replace(value)
}

func appendUnique(values []string, value string) []string {
	for _, existing := range values {
		if existing == value {
			return values
		}
	}
	return append(values, value)
}

func progressEvent(opts *globalOptions, event string, data map[string]any) {
	if opts.Events {
		writeEvent(event, data)
	}
}

func chatToListResponse(chat beeperdesktopapi.Chat) beeperdesktopapi.ChatListResponse {
	data, _ := json.Marshal(chat)
	var out beeperdesktopapi.ChatListResponse
	_ = json.Unmarshal(data, &out)
	return out
}
