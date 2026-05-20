package cli

import (
	"context"
	"encoding/json"
	"os"
	"strings"
	"time"

	beeperdesktopapi "github.com/beeper/desktop-api-go/v5"
	"github.com/beeper/desktop-api-go/v5/packages/param"
	"github.com/beeper/desktop-api-go/v5/shared"
	"github.com/spf13/cobra"
)

func addMessageFlags(cmd *cobra.Command, spec commandSpec) {
	switch spec.Name {
	case "messages:list":
		cmd.Flags().String("chat", "", "Chat selector (ID, local ID, title, or search text)")
		cmd.Flags().Int("pick", 0, "Pick the Nth result when the selector is ambiguous (1-indexed)")
		cmd.Flags().Int("limit", 20, "Maximum messages to print")
	case "messages:search":
		cmd.Flags().String("query", "", "Search query")
		cmd.Flags().Int("limit", 20, "Maximum messages to print")
	case "messages:show":
		cmd.Flags().String("chat", "", "Chat selector (ID, local ID, title, or search text)")
		cmd.Flags().String("id", "", "Message ID, pendingMessageID, or Matrix event ID")
		cmd.Flags().Int("pick", 0, "Pick the Nth result when the selector is ambiguous (1-indexed)")
	case "messages:context":
		cmd.Flags().String("chat", "", "Chat selector (ID, local ID, title, or search text)")
		cmd.Flags().String("id", "", "Target message ID to center the window on")
		cmd.Flags().Int("before", 10, "Number of messages to include before the target")
		cmd.Flags().Int("after", 10, "Number of messages to include after the target")
		cmd.Flags().Int("pick", 0, "Pick the Nth result when the selector is ambiguous (1-indexed)")
	case "messages:export":
		cmd.Flags().String("chat", "", "Chat selector (ID, local ID, title, or search text)")
		cmd.Flags().Int("pick", 0, "Pick the Nth result when the selector is ambiguous (1-indexed)")
		cmd.Flags().String("before-cursor", "", "Paginate messages older than this message ID")
		cmd.Flags().String("after-cursor", "", "Paginate messages newer than this message ID")
		cmd.Flags().String("after", "", "Only messages at or after this ISO timestamp")
		cmd.Flags().String("before", "", "Only messages at or before this ISO timestamp")
		cmd.Flags().Int("limit", 0, "Maximum messages to export")
		cmd.Flags().StringP("output", "o", "-", "Output path; - writes JSON to stdout")
		cmd.Flags().Bool("asc", false, "Order oldest first")
	case "messages:delete":
		cmd.Flags().String("chat", "", "Chat selector (ID, local ID, title, or search text)")
		cmd.Flags().String("id", "", "Message ID to delete")
		cmd.Flags().Int("pick", 0, "Pick the Nth result when the selector is ambiguous (1-indexed)")
		cmd.Flags().Bool("for-everyone", false, "Delete for everyone when the network supports it")
	case "messages:edit":
		cmd.Flags().String("chat", "", "Chat selector (ID, local ID, title, or search text)")
		cmd.Flags().Int("pick", 0, "Pick the Nth result when the selector is ambiguous (1-indexed)")
		cmd.Flags().String("message", "", "Message ID")
		cmd.Flags().String("text", "", "New text content")
	case "send:react":
		cmd.Flags().String("to", "", "Chat selector (ID, local ID, title, or search text)")
		cmd.Flags().String("id", "", "Message ID to react to")
		cmd.Flags().String("reaction", "", "Reaction key to add")
	case "send:unreact":
		cmd.Flags().String("to", "", "Chat selector (ID, local ID, title, or search text)")
		cmd.Flags().String("id", "", "Message ID whose reaction to remove")
		cmd.Flags().String("reaction", "", "Reaction key to remove")
	case "send:text":
		cmd.Flags().String("to", "", "Chat selector (ID, local ID, title, or search text)")
		cmd.Flags().String("message", "", "Message text to send")
		cmd.Flags().Int("pick", 0, "Pick the Nth result when the selector is ambiguous (1-indexed)")
		cmd.Flags().String("reply-to", "", "Send as a reply to this message ID")
		cmd.Flags().Bool("wait", false, "Wait for the message to leave the pending state (or fail) before returning")
		cmd.Flags().Int("wait-timeout", 0, "Maximum wait time in ms when --wait is set")
	case "send:file", "send:sticker", "send:voice":
		cmd.Flags().String("to", "", "Chat selector (ID, local ID, title, or search text)")
		cmd.Flags().String("file", "", "Local file path to upload")
		cmd.Flags().String("caption", "", "Optional caption to send alongside the file")
		cmd.Flags().String("filename", "", "Override the displayed filename")
		cmd.Flags().String("mime", "", "Override MIME type detection")
		cmd.Flags().Int("pick", 0, "Pick the Nth result when the selector is ambiguous (1-indexed)")
		cmd.Flags().String("reply-to", "", "Send as a reply to this message ID")
		cmd.Flags().Int("duration", 0, "Voice note duration in seconds")
		cmd.Flags().Bool("wait", false, "Wait for the message to leave the pending state (or fail) before returning")
		cmd.Flags().Int("wait-timeout", 0, "Maximum wait time in ms when --wait is set")
	}
}

func firstFlag(cmd *cobra.Command, names ...string) string {
	for _, name := range names {
		if flag := cmd.Flags().Lookup(name); flag != nil && flag.Value.String() != "" {
			return flag.Value.String()
		}
	}
	return ""
}

func flagOrPos(cmd *cobra.Command, args []string, flag string, pos int) string {
	if value := firstFlag(cmd, flag); value != "" {
		return value
	}
	if len(args) > pos {
		return args[pos]
	}
	return ""
}

func runMessageCommand(opts *globalOptions, spec commandSpec, cmd *cobra.Command, args []string) error {
	client, ctx, cancel, err := newClient(opts)
	if err != nil {
		return err
	}
	defer cancel()

	switch spec.Name {
	case "messages:list":
		selector := firstArgOrFlag(cmd, args, "chat")
		pick, _ := cmd.Flags().GetInt("pick")
		chatID, err := resolveChatID(ctx, client, selector, pick)
		if err != nil {
			return err
		}
		limit, _ := cmd.Flags().GetInt("limit")
		params := beeperdesktopapi.MessageListParams{}
		beforeCursor := firstFlag(cmd, "before-cursor")
		afterCursor := firstFlag(cmd, "after-cursor")
		if beforeCursor != "" && afterCursor != "" {
			return usageError("use only one of --before-cursor or --after-cursor")
		}
		if beforeCursor != "" {
			params.Cursor = param.NewOpt(beforeCursor)
			params.Direction = beeperdesktopapi.MessageListParamsDirectionBefore
		}
		if afterCursor != "" {
			params.Cursor = param.NewOpt(afterCursor)
			params.Direction = beeperdesktopapi.MessageListParamsDirectionAfter
		}
		sender := firstFlag(cmd, "sender")
		pager := client.Messages.ListAutoPaging(ctx, chatID, params)
		rows := []shared.Message{}
		for pager.Next() {
			row := pager.Current()
			if !messageMatchesSender(row, sender) {
				continue
			}
			rows = append(rows, row)
			if len(rows) >= limit {
				break
			}
		}
		if err := pager.Err(); err != nil {
			return err
		}
		if asc, _ := cmd.Flags().GetBool("asc"); asc {
			reverseMessages(rows)
		}
		if ids, _ := cmd.Flags().GetBool("ids"); ids {
			return printData(opts, messageIDs(rows))
		}
		return printData(opts, rows)
	case "messages:search":
		query, _ := cmd.Flags().GetString("query")
		if query == "" && len(args) > 0 {
			query = args[0]
		}
		if query == "" {
			return usageError("missing search query")
		}
		limit, _ := cmd.Flags().GetInt("limit")
		params := beeperdesktopapi.MessageSearchParams{
			Query: param.NewOpt(query),
			Limit: param.NewOpt(int64(limit)),
		}
		if flagChanged(cmd, "exclude-low-priority") {
			exclude, _ := cmd.Flags().GetBool("exclude-low-priority")
			params.ExcludeLowPriority = param.NewOpt(exclude)
		}
		if flagChanged(cmd, "include-muted") {
			include, _ := cmd.Flags().GetBool("include-muted")
			params.IncludeMuted = param.NewOpt(include)
		}
		if sender := firstFlag(cmd, "sender"); sender != "" {
			params.Sender = param.NewOpt(sender)
		}
		if chatType := firstFlag(cmd, "chat-type"); chatType != "" {
			switch chatType {
			case "group":
				params.ChatType = beeperdesktopapi.MessageSearchParamsChatTypeGroup
			case "single", "direct", "dm":
				params.ChatType = beeperdesktopapi.MessageSearchParamsChatTypeSingle
			default:
				return usageError("--chat-type must be group or single")
			}
		}
		afterTime, beforeTime, err := messageTimeFilters(cmd)
		if err != nil {
			return err
		}
		if afterTime != nil {
			params.DateAfter = param.NewOpt(*afterTime)
		}
		if beforeTime != nil {
			params.DateBefore = param.NewOpt(*beforeTime)
		}
		if accountSelectors, _ := cmd.Flags().GetStringArray("account"); len(accountSelectors) > 0 {
			accounts, err := resolveAccountIDs(ctx, client, accountSelectors, false)
			if err != nil {
				return err
			}
			params.AccountIDs = accounts
		}
		if chatSelectors, _ := cmd.Flags().GetStringArray("chat"); len(chatSelectors) > 0 {
			for _, selector := range chatSelectors {
				chatID, err := resolveChatID(ctx, client, selector, 0)
				if err != nil {
					return err
				}
				params.ChatIDs = append(params.ChatIDs, chatID)
			}
		}
		if mediaTypes, _ := cmd.Flags().GetStringArray("media"); len(mediaTypes) > 0 {
			params.MediaTypes = mediaTypes
		}
		pager := client.Messages.SearchAutoPaging(ctx, params)
		rows := []shared.Message{}
		for pager.Next() {
			rows = append(rows, pager.Current())
			if len(rows) >= limit {
				break
			}
		}
		if err := pager.Err(); err != nil {
			return err
		}
		if ids, _ := cmd.Flags().GetBool("ids"); ids {
			return printData(opts, messageIDs(rows))
		}
		return printData(opts, rows)
	case "messages:show":
		selector := firstArgOrFlag(cmd, args, "chat")
		pick, _ := cmd.Flags().GetInt("pick")
		chatID, err := resolveChatID(ctx, client, selector, pick)
		if err != nil {
			return err
		}
		messageID := firstFlag(cmd, "id", "message")
		if messageID == "" && len(args) > 1 {
			messageID = args[1]
		}
		if chatID == "" || messageID == "" {
			return usageError("messages show requires --chat and --id")
		}
		res, err := client.Messages.Get(ctx, messageID, beeperdesktopapi.MessageGetParams{ChatID: chatID})
		if err != nil {
			return err
		}
		return printData(opts, res)
	case "messages:context":
		selector := firstArgOrFlag(cmd, args, "chat")
		pick, _ := cmd.Flags().GetInt("pick")
		chatID, err := resolveChatID(ctx, client, selector, pick)
		if err != nil {
			return err
		}
		messageID := firstFlag(cmd, "id", "message")
		if messageID == "" && len(args) > 1 {
			messageID = args[1]
		}
		if chatID == "" || messageID == "" {
			return usageError("messages context requires --chat and --id")
		}
		beforeLimit, _ := cmd.Flags().GetInt("before")
		afterLimit, _ := cmd.Flags().GetInt("after")
		before, err := collectMessages(ctx, client, chatID, beeperdesktopapi.MessageListParams{
			Cursor:    param.NewOpt(messageID),
			Direction: beeperdesktopapi.MessageListParamsDirectionBefore,
		}, beforeLimit)
		if err != nil {
			return err
		}
		after, err := collectMessages(ctx, client, chatID, beeperdesktopapi.MessageListParams{
			Cursor:    param.NewOpt(messageID),
			Direction: beeperdesktopapi.MessageListParamsDirectionAfter,
		}, afterLimit)
		if err != nil {
			return err
		}
		return printData(opts, map[string]any{"chatID": chatID, "messageID": messageID, "before": before, "after": after})
	case "messages:export":
		selector := firstArgOrFlag(cmd, args, "chat")
		pick, _ := cmd.Flags().GetInt("pick")
		chatID, err := resolveChatID(ctx, client, selector, pick)
		if err != nil {
			return err
		}
		beforeCursor := firstFlag(cmd, "before-cursor")
		afterCursor := firstFlag(cmd, "after-cursor")
		if beforeCursor != "" && afterCursor != "" {
			return usageError("use only one of --before-cursor or --after-cursor")
		}
		params := beeperdesktopapi.MessageListParams{}
		if beforeCursor != "" {
			params.Cursor = param.NewOpt(beforeCursor)
			params.Direction = beeperdesktopapi.MessageListParamsDirectionBefore
		}
		if afterCursor != "" {
			params.Cursor = param.NewOpt(afterCursor)
			params.Direction = beeperdesktopapi.MessageListParamsDirectionAfter
		}
		limit, _ := cmd.Flags().GetInt("limit")
		rows, err := collectMessages(ctx, client, chatID, params, limit)
		if err != nil {
			return err
		}
		afterTime, beforeTime, err := messageTimeFilters(cmd)
		if err != nil {
			return err
		}
		filtered := []shared.Message{}
		for _, row := range rows {
			if afterTime != nil && row.Timestamp.Before(*afterTime) {
				continue
			}
			if beforeTime != nil && row.Timestamp.After(*beforeTime) {
				continue
			}
			filtered = append(filtered, row)
		}
		asc, _ := cmd.Flags().GetBool("asc")
		if asc {
			for i, j := 0, len(filtered)-1; i < j; i, j = i+1, j-1 {
				filtered[i], filtered[j] = filtered[j], filtered[i]
			}
		}
		envelope := map[string]any{"exportedAt": time.Now().UTC().Format(time.RFC3339), "chatID": chatID, "count": len(filtered), "messages": filtered}
		output := firstFlag(cmd, "output")
		if output == "" || output == "-" {
			encoder := json.NewEncoder(os.Stdout)
			encoder.SetIndent("", "  ")
			return encoder.Encode(envelope)
		}
		data, err := json.MarshalIndent(envelope, "", "  ")
		if err != nil {
			return err
		}
		data = append(data, '\n')
		return os.WriteFile(output, data, 0o600)
	case "messages:delete":
		selector := firstArgOrFlag(cmd, args, "chat")
		pick, _ := cmd.Flags().GetInt("pick")
		chatID, err := resolveChatID(ctx, client, selector, pick)
		if err != nil {
			return err
		}
		messageID := firstFlag(cmd, "id", "message")
		if messageID == "" && len(args) > 1 {
			messageID = args[1]
		}
		if chatID == "" || messageID == "" {
			return usageError("messages delete requires --chat and --id")
		}
		forEveryone, _ := cmd.Flags().GetBool("for-everyone")
		params := beeperdesktopapi.MessageDeleteParams{ChatID: chatID}
		if forEveryone {
			params.ForEveryone = param.NewOpt(true)
		}
		if err := client.Messages.Delete(ctx, messageID, params); err != nil {
			return err
		}
		return printData(opts, map[string]any{"chatID": chatID, "messageID": messageID, "forEveryone": forEveryone})
	case "messages:edit":
		selector := firstArgOrFlag(cmd, args, "chat")
		pick, _ := cmd.Flags().GetInt("pick")
		chatID, err := resolveChatID(ctx, client, selector, pick)
		if err != nil {
			return err
		}
		messageID := flagOrPos(cmd, args, "message", 1)
		text := firstFlag(cmd, "text")
		if chatID == "" || messageID == "" || text == "" {
			return usageError("messages edit requires --chat, --message, and --text")
		}
		res, err := client.Messages.Update(ctx, messageID, beeperdesktopapi.MessageUpdateParams{ChatID: chatID, Text: text})
		if err != nil {
			return err
		}
		return printData(opts, res)
	case "send:react":
		selector := firstArgOrFlag(cmd, args, "to")
		pick, _ := cmd.Flags().GetInt("pick")
		chatID, err := resolveChatID(ctx, client, selector, pick)
		if err != nil {
			return err
		}
		messageID := firstFlag(cmd, "id", "message")
		reaction := firstFlag(cmd, "reaction", "emoji")
		if chatID == "" || messageID == "" || reaction == "" {
			return usageError("send react requires --to, --message, and --reaction")
		}
		params := beeperdesktopapi.ChatMessageReactionAddParams{ChatID: chatID, ReactionKey: reaction}
		if transactionID := firstFlag(cmd, "transaction"); transactionID != "" {
			params.TransactionID = param.NewOpt(transactionID)
		}
		res, err := client.Chats.Messages.Reactions.Add(ctx, messageID, params)
		if err != nil {
			return err
		}
		return printData(opts, res)
	case "send:unreact":
		selector := firstArgOrFlag(cmd, args, "to")
		pick, _ := cmd.Flags().GetInt("pick")
		chatID, err := resolveChatID(ctx, client, selector, pick)
		if err != nil {
			return err
		}
		messageID := firstFlag(cmd, "id", "message")
		reaction := firstFlag(cmd, "reaction", "emoji")
		if transactionID := firstFlag(cmd, "transaction"); transactionID != "" {
			return usageError("send unreact --transaction is not exposed by github.com/beeper/desktop-api-go/v5")
		}
		if chatID == "" || messageID == "" || reaction == "" {
			return usageError("send unreact requires --to, --message, and --reaction")
		}
		res, err := client.Chats.Messages.Reactions.Delete(ctx, reaction, beeperdesktopapi.ChatMessageReactionDeleteParams{ChatID: chatID, MessageID: messageID})
		if err != nil {
			return err
		}
		return printData(opts, res)
	case "send:text":
		selector, _ := cmd.Flags().GetString("to")
		pick, _ := cmd.Flags().GetInt("pick")
		chatID, err := resolveChatID(ctx, client, selector, pick)
		if err != nil {
			return err
		}
		text, _ := cmd.Flags().GetString("message")
		replyTo, _ := cmd.Flags().GetString("reply-to")
		if chatID == "" {
			return usageError("missing --to")
		}
		if text == "" {
			return usageError("missing --message")
		}
		body := beeperdesktopapi.MessageSendParams{Text: param.NewOpt(text)}
		if replyTo != "" {
			body.ReplyToMessageID = param.NewOpt(replyTo)
		}
		res, err := client.Messages.Send(ctx, chatID, body)
		if err != nil {
			return err
		}
		if wait, _ := cmd.Flags().GetBool("wait"); wait {
			message, err := waitForSentMessage(ctx, client, chatID, res.PendingMessageID, cmd)
			if err != nil {
				return err
			}
			return printData(opts, map[string]any{"send": res, "message": message})
		}
		return printData(opts, res)
	case "send:file", "send:sticker", "send:voice":
		selector := firstArgOrFlag(cmd, args, "to")
		pick, _ := cmd.Flags().GetInt("pick")
		chatID, err := resolveChatID(ctx, client, selector, pick)
		if err != nil {
			return err
		}
		file := firstFlag(cmd, "file")
		if chatID == "" || file == "" {
			return usageError("%s requires --to and --file", spec.Name)
		}
		if spec.Name == "send:sticker" && firstFlag(cmd, "mime") == "" {
			_ = cmd.Flags().Set("mime", "image/webp")
		}
		if spec.Name == "send:voice" && firstFlag(cmd, "mime") == "" {
			_ = cmd.Flags().Set("mime", "audio/ogg")
		}
		upload, err := uploadAssetFromFlags(ctx, client, cmd, file)
		if err != nil {
			return err
		}
		attachment := messageAttachmentFromUpload(upload)
		switch spec.Name {
		case "send:sticker":
			attachment.Type = "sticker"
		case "send:voice":
			attachment.Type = "voice-note"
			if duration, _ := cmd.Flags().GetInt("duration"); duration > 0 {
				attachment.Duration = param.NewOpt(float64(duration))
			}
		}
		body := beeperdesktopapi.MessageSendParams{Attachment: attachment}
		if caption := firstFlag(cmd, "caption"); caption != "" {
			body.Text = param.NewOpt(caption)
		}
		if replyTo := firstFlag(cmd, "reply-to"); replyTo != "" {
			body.ReplyToMessageID = param.NewOpt(replyTo)
		}
		res, err := client.Messages.Send(ctx, chatID, body)
		if err != nil {
			return err
		}
		if wait, _ := cmd.Flags().GetBool("wait"); wait {
			message, err := waitForSentMessage(ctx, client, chatID, res.PendingMessageID, cmd)
			if err != nil {
				return err
			}
			return printData(opts, map[string]any{"send": res, "message": message})
		}
		return printData(opts, res)
	default:
		return usageError("%s is registered but no typed message handler is available", spec.Name)
	}
}

func waitForSentMessage(ctx context.Context, client beeperdesktopapi.Client, chatID, pendingMessageID string, cmd *cobra.Command) (*shared.Message, error) {
	if pendingMessageID == "" {
		return nil, usageError("Desktop did not return a pendingMessageID")
	}
	timeoutMS, _ := cmd.Flags().GetInt("wait-timeout")
	timeout := 30 * time.Second
	if timeoutMS > 0 {
		timeout = time.Duration(timeoutMS) * time.Millisecond
	}
	waitCtx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()
	ticker := time.NewTicker(500 * time.Millisecond)
	defer ticker.Stop()
	for {
		message, err := client.Messages.Get(waitCtx, pendingMessageID, beeperdesktopapi.MessageGetParams{ChatID: chatID})
		if err == nil {
			status := strings.ToUpper(message.SendStatus.Status)
			switch status {
			case "", "SUCCESS":
				return message, nil
			case "PENDING":
			case "FAIL_RETRIABLE", "FAIL_PERMANENT":
				return message, usageError("message send failed: %s", firstNonEmpty(message.SendStatus.Message, message.SendStatus.Reason, status))
			default:
				return message, nil
			}
		}
		select {
		case <-waitCtx.Done():
			return nil, usageError("timed out waiting for message %s to leave pending state", pendingMessageID)
		case <-ticker.C:
		}
	}
}

func collectMessages(ctx context.Context, client beeperdesktopapi.Client, chatID string, params beeperdesktopapi.MessageListParams, limit int) ([]shared.Message, error) {
	pager := client.Messages.ListAutoPaging(ctx, chatID, params)
	rows := []shared.Message{}
	for pager.Next() {
		rows = append(rows, pager.Current())
		if limit > 0 && len(rows) >= limit {
			break
		}
	}
	return rows, pager.Err()
}

func messageMatchesSender(message shared.Message, sender string) bool {
	switch sender {
	case "":
		return true
	case "me":
		return message.IsSender
	case "others":
		return !message.IsSender
	default:
		return message.SenderID == sender
	}
}

func messageIDs(messages []shared.Message) []string {
	ids := make([]string, 0, len(messages))
	for _, message := range messages {
		ids = append(ids, message.ID)
	}
	return ids
}

func reverseMessages(messages []shared.Message) {
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}
}

func messageTimeFilters(cmd *cobra.Command) (*time.Time, *time.Time, error) {
	var afterTime *time.Time
	var beforeTime *time.Time
	if value := firstFlag(cmd, "after"); value != "" {
		parsed, err := time.Parse(time.RFC3339, value)
		if err != nil {
			return nil, nil, usageError("--after is not a valid ISO timestamp: %s", value)
		}
		afterTime = &parsed
	}
	if value := firstFlag(cmd, "before"); value != "" {
		parsed, err := time.Parse(time.RFC3339, value)
		if err != nil {
			return nil, nil, usageError("--before is not a valid ISO timestamp: %s", value)
		}
		beforeTime = &parsed
	}
	return afterTime, beforeTime, nil
}

func messageAttachmentFromUpload(upload *beeperdesktopapi.AssetUploadResponse) beeperdesktopapi.MessageSendParamsAttachment {
	attachment := beeperdesktopapi.MessageSendParamsAttachment{
		UploadID: upload.UploadID,
		FileName: param.NewOpt(upload.FileName),
		MimeType: param.NewOpt(upload.MimeType),
	}
	if upload.Duration != 0 {
		attachment.Duration = param.NewOpt(upload.Duration)
	}
	if upload.Width != 0 || upload.Height != 0 {
		attachment.Size = beeperdesktopapi.MessageSendParamsAttachmentSize{
			Width:  upload.Width,
			Height: upload.Height,
		}
	}
	return attachment
}
