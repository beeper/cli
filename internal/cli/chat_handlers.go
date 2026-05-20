package cli

import (
	"context"
	"fmt"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"

	beeperdesktopapi "github.com/beeper/desktop-api-go/v5"
	"github.com/beeper/desktop-api-go/v5/packages/param"
	"github.com/spf13/cobra"
)

func addChatFlags(cmd *cobra.Command, spec commandSpec) {
	switch spec.Name {
	case "chats", "chats:list", "accounts:chats":
		cmd.Flags().StringArray("account", nil, "Limit to account selector")
		cmd.Flags().Bool("ids", false, "Print preferred chat selectors, using numeric local chat IDs when available")
		cmd.Flags().Int("limit", 20, "Maximum chats to print")
		cmd.Flags().Bool("archived", false, "Only archived chats")
		cmd.Flags().Bool("pinned", false, "Only pinned chats")
		cmd.Flags().Bool("muted", false, "Only muted chats")
		cmd.Flags().Bool("unread", false, "Only chats with unread messages")
		cmd.Flags().Bool("low-priority", false, "Only Low Priority chats")
		cmd.Flags().Bool("no-archived", false, "Exclude archived chats")
		cmd.Flags().Bool("no-pinned", false, "Exclude pinned chats")
		cmd.Flags().Bool("no-muted", false, "Exclude muted chats")
		cmd.Flags().Bool("no-unread", false, "Exclude chats with unread messages")
		cmd.Flags().Bool("no-low-priority", false, "Exclude Low Priority chats")
	case "chats:show":
		cmd.Flags().String("chat", "", "Chat selector (ID, local ID, title, or search text)")
		cmd.Flags().Int("pick", 0, "Pick the Nth result when the selector is ambiguous (1-indexed)")
	case "chats:search":
		cmd.Flags().StringArray("account", nil, "Limit to account selector")
		cmd.Flags().Bool("ids", false, "Print preferred chat selectors, using numeric local chat IDs when available")
		cmd.Flags().String("query", "", "Search query")
		cmd.Flags().Int("limit", 20, "Maximum chats to print")
	case "chats:archive", "chats:unarchive", "chats:avatar", "chats:description", "chats:disappear", "chats:draft", "chats:mark-read", "chats:mark-unread", "chats:mute", "chats:unmute", "chats:notify-anyway", "chats:pin", "chats:unpin", "chats:priority", "chats:remind", "chats:unremind", "chats:rename", "chats:start", "chats:focus":
		cmd.Flags().String("chat", "", "Chat selector (ID, local ID, title, or search text)")
		cmd.Flags().Int("pick", 0, "Pick the Nth result when the selector is ambiguous (1-indexed)")
		if spec.Name == "chats:remind" {
			cmd.Flags().String("at", "", "Reminder time as Unix milliseconds, RFC3339, or duration from now")
			cmd.Flags().Bool("dismiss-on-reply", false, "Cancel reminder if someone messages in the chat")
		}
		if spec.Name == "chats:focus" {
			cmd.Flags().String("message", "", "Message ID to jump to")
			cmd.Flags().String("draft", "", "Draft text to populate")
			cmd.Flags().String("attachment", "", "Draft attachment path")
		}
	}
}

func runChatCommand(opts *globalOptions, spec commandSpec, cmd *cobra.Command, args []string) error {
	client, ctx, cancel, err := newClient(opts)
	if err != nil {
		return err
	}
	defer cancel()

	switch spec.Name {
	case "chats", "chats:list", "accounts:chats":
		limit, _ := cmd.Flags().GetInt("limit")
		accountSelectors, _ := cmd.Flags().GetStringArray("account")
		accounts, err := resolveAccountIDs(ctx, client, accountSelectors, true)
		if err != nil {
			return err
		}
		ids, _ := cmd.Flags().GetBool("ids")
		pager := client.Chats.ListAutoPaging(ctx, beeperdesktopapi.ChatListParams{AccountIDs: accounts})
		rows := []beeperdesktopapi.ChatListResponse{}
		for pager.Next() {
			row := pager.Current()
			if !matchesChatStateFilters(cmd, chatStateFromListResponse(row)) {
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
		if ids {
			values := []string{}
			for _, row := range rows {
				if row.LocalChatID != "" {
					values = append(values, row.LocalChatID)
				} else {
					values = append(values, row.ID)
				}
			}
			return printData(opts, values)
		}
		return printData(opts, rows)
	case "chats:show":
		selector := firstArgOrFlag(cmd, args, "chat")
		pick, _ := cmd.Flags().GetInt("pick")
		chatID, err := resolveChatID(ctx, client, selector, pick)
		if err != nil {
			return err
		}
		chat, err := client.Chats.Get(ctx, chatID, beeperdesktopapi.ChatGetParams{})
		if err != nil {
			return err
		}
		return printData(opts, chat)
	case "chats:search":
		query, _ := cmd.Flags().GetString("query")
		if query == "" && len(args) > 0 {
			query = args[0]
		}
		if query == "" {
			return usageError("missing search query")
		}
		limit, _ := cmd.Flags().GetInt("limit")
		accountSelectors, _ := cmd.Flags().GetStringArray("account")
		accounts, err := resolveAccountIDs(ctx, client, accountSelectors, true)
		if err != nil {
			return err
		}
		ids, _ := cmd.Flags().GetBool("ids")
		pager := client.Chats.SearchAutoPaging(ctx, beeperdesktopapi.ChatSearchParams{
			AccountIDs: accounts,
			Query:      param.NewOpt(query),
			Limit:      param.NewOpt(int64(limit)),
		})
		rows := []beeperdesktopapi.Chat{}
		for pager.Next() {
			rows = append(rows, pager.Current())
			if len(rows) >= limit {
				break
			}
		}
		if err := pager.Err(); err != nil {
			return err
		}
		if ids {
			values := []string{}
			for _, row := range rows {
				values = append(values, chatInputID(row))
			}
			return printData(opts, values)
		}
		return printData(opts, rows)
	case "chats:archive", "chats:unarchive":
		chatID, err := resolveChatFromFlags(ctx, client, cmd, args)
		if err != nil {
			return err
		}
		err = client.Chats.Archive(ctx, chatID, beeperdesktopapi.ChatArchiveParams{Archived: param.NewOpt(spec.Name == "chats:archive")})
		if err != nil {
			return err
		}
		return printData(opts, map[string]any{"chatID": chatID, "archived": spec.Name == "chats:archive"})
	case "chats:avatar":
		chatID, err := resolveChatFromFlags(ctx, client, cmd, args)
		if err != nil {
			return err
		}
		clear, _ := cmd.Flags().GetBool("clear")
		file := firstFlag(cmd, "file")
		if !clear && file == "" {
			return usageError("provide --file or --clear")
		}
		body := beeperdesktopapi.ChatUpdateParams{}
		if clear {
			body.ImgURL = param.Null[string]()
		} else {
			body.ImgURL = param.NewOpt(file)
		}
		res, err := client.Chats.Update(ctx, chatID, body)
		if err != nil {
			return err
		}
		return printData(opts, res)
	case "chats:description":
		chatID, err := resolveChatFromFlags(ctx, client, cmd, args)
		if err != nil {
			return err
		}
		clear, _ := cmd.Flags().GetBool("clear")
		description := firstFlag(cmd, "description")
		if !clear && description == "" {
			return usageError("provide --description or --clear")
		}
		body := beeperdesktopapi.ChatUpdateParams{}
		if clear {
			body.Description = param.Null[string]()
		} else {
			body.Description = param.NewOpt(description)
		}
		res, err := client.Chats.Update(ctx, chatID, body)
		if err != nil {
			return err
		}
		return printData(opts, res)
	case "chats:disappear":
		chatID, err := resolveChatFromFlags(ctx, client, cmd, args)
		if err != nil {
			return err
		}
		seconds := firstFlag(cmd, "seconds")
		if seconds == "" {
			return usageError("missing --seconds")
		}
		body := beeperdesktopapi.ChatUpdateParams{}
		if strings.EqualFold(seconds, "off") {
			body.MessageExpirySeconds = param.Null[int64]()
		} else {
			value, err := strconv.ParseInt(seconds, 10, 64)
			if err != nil || value < 0 {
				return usageError("--seconds must be a positive integer or \"off\"")
			}
			body.MessageExpirySeconds = param.NewOpt(value)
		}
		res, err := client.Chats.Update(ctx, chatID, body)
		if err != nil {
			return err
		}
		return printData(opts, res)
	case "chats:draft":
		chatID, err := resolveChatFromFlags(ctx, client, cmd, args)
		if err != nil {
			return err
		}
		clear, _ := cmd.Flags().GetBool("clear")
		text := firstFlag(cmd, "text")
		file := firstFlag(cmd, "file")
		if clear && (text != "" || file != "") {
			return usageError("--clear cannot be combined with --text or --file")
		}
		if !clear && text == "" {
			return usageError("provide --text TEXT (and optionally --file PATH) or --clear")
		}
		body := beeperdesktopapi.ChatUpdateParams{}
		if clear {
			body.Draft = param.NullStruct[beeperdesktopapi.ChatUpdateParamsDraft]()
		} else {
			draft := beeperdesktopapi.ChatUpdateParamsDraft{Text: text}
			if file != "" {
				upload, err := uploadAssetFromFlags(ctx, client, cmd, file)
				if err != nil {
					return err
				}
				draft.Attachments = map[string]beeperdesktopapi.ChatUpdateParamsDraftAttachment{
					upload.UploadID: draftAttachmentFromUpload(upload),
				}
			}
			body.Draft = draft
		}
		res, err := client.Chats.Update(ctx, chatID, body)
		if err != nil {
			return err
		}
		return printData(opts, res)
	case "chats:mark-read", "chats:mark-unread":
		chatID, err := resolveChatFromFlags(ctx, client, cmd, args)
		if err != nil {
			return err
		}
		messageID := firstFlag(cmd, "message")
		if spec.Name == "chats:mark-read" {
			body := beeperdesktopapi.ChatMarkReadParams{}
			if messageID != "" {
				body.MessageID = param.NewOpt(messageID)
			}
			res, err := client.Chats.MarkRead(ctx, chatID, body)
			if err != nil {
				return err
			}
			return printData(opts, res)
		}
		body := beeperdesktopapi.ChatMarkUnreadParams{}
		if messageID != "" {
			body.MessageID = param.NewOpt(messageID)
		}
		res, err := client.Chats.MarkUnread(ctx, chatID, body)
		if err != nil {
			return err
		}
		return printData(opts, res)
	case "chats:mute", "chats:unmute", "chats:pin", "chats:unpin":
		chatID, err := resolveChatFromFlags(ctx, client, cmd, args)
		if err != nil {
			return err
		}
		body := beeperdesktopapi.ChatUpdateParams{}
		switch spec.Name {
		case "chats:mute":
			body.IsMuted = param.NewOpt(true)
		case "chats:unmute":
			body.IsMuted = param.NewOpt(false)
		case "chats:pin":
			body.IsPinned = param.NewOpt(true)
		case "chats:unpin":
			body.IsPinned = param.NewOpt(false)
		}
		res, err := client.Chats.Update(ctx, chatID, body)
		if err != nil {
			return err
		}
		return printData(opts, res)
	case "chats:notify-anyway":
		chatID, err := resolveChatFromFlags(ctx, client, cmd, args)
		if err != nil {
			return err
		}
		res, err := client.Chats.NotifyAnyway(ctx, chatID, beeperdesktopapi.ChatNotifyAnywayParams{})
		if err != nil {
			return err
		}
		return printData(opts, res)
	case "chats:priority":
		chatID, err := resolveChatFromFlags(ctx, client, cmd, args)
		if err != nil {
			return err
		}
		level := firstFlag(cmd, "level")
		if level == "" {
			return usageError("missing --level")
		}
		body := beeperdesktopapi.ChatUpdateParams{}
		switch level {
		case "inbox":
			body.IsArchived = param.NewOpt(false)
			body.IsLowPriority = param.NewOpt(false)
		case "low":
			body.IsLowPriority = param.NewOpt(true)
		default:
			return usageError("--level must be inbox or low")
		}
		res, err := client.Chats.Update(ctx, chatID, body)
		if err != nil {
			return err
		}
		return printData(opts, res)
	case "chats:remind":
		chatID, err := resolveChatFromFlags(ctx, client, cmd, args)
		if err != nil {
			return err
		}
		at, _ := cmd.Flags().GetString("at")
		remindAt, err := parseReminderTime(at)
		if err != nil {
			return err
		}
		dismiss, _ := cmd.Flags().GetBool("dismiss-on-reply")
		err = client.Chats.Reminders.New(ctx, chatID, beeperdesktopapi.ChatReminderNewParams{
			Reminder: beeperdesktopapi.ChatReminderNewParamsReminder{
				RemindAt:                 remindAt,
				DismissOnIncomingMessage: param.NewOpt(dismiss),
			},
		})
		if err != nil {
			return err
		}
		return printData(opts, map[string]any{"chatID": chatID, "remindAt": remindAt})
	case "chats:unremind":
		chatID, err := resolveChatFromFlags(ctx, client, cmd, args)
		if err != nil {
			return err
		}
		if err := client.Chats.Reminders.Delete(ctx, chatID); err != nil {
			return err
		}
		return printData(opts, map[string]any{"chatID": chatID, "reminder": nil})
	case "chats:rename":
		chatID, err := resolveChatFromFlags(ctx, client, cmd, args)
		if err != nil {
			return err
		}
		title := firstFlag(cmd, "title")
		if title == "" {
			return usageError("missing --title")
		}
		res, err := client.Chats.Update(ctx, chatID, beeperdesktopapi.ChatUpdateParams{Title: param.NewOpt(title)})
		if err != nil {
			return err
		}
		return printData(opts, res)
	case "chats:start":
		userInput := flagOrPos(cmd, args, "user", 0)
		if userInput == "" {
			return usageError("missing user")
		}
		if title := firstFlag(cmd, "title"); title != "" {
			return usageError("chats start --title is not exposed by github.com/beeper/desktop-api-go/v5")
		}
		accountID := firstFlag(cmd, "account")
		if accountID != "" {
			resolved, err := resolveAccountID(ctx, client, accountID)
			if err != nil {
				return err
			}
			accountID = resolved
		} else {
			var err error
			accountID, err = defaultAccountID(ctx, client)
			if err != nil {
				return err
			}
		}
		body := beeperdesktopapi.ChatStartParams{
			AccountID: accountID,
			User:      userQueryFromInput(userInput),
		}
		if message := firstFlag(cmd, "message", "message-text"); message != "" {
			body.MessageText = param.NewOpt(message)
		}
		res, err := client.Chats.Start(ctx, body)
		if err != nil {
			return err
		}
		return printData(opts, res)
	case "chats:focus":
		chatID, err := resolveChatFromFlags(ctx, client, cmd, args)
		if err != nil {
			return err
		}
		body := beeperdesktopapi.FocusParams{ChatID: param.NewOpt(chatID)}
		if value := firstFlag(cmd, "message"); value != "" {
			body.MessageID = param.NewOpt(value)
		}
		if value := firstFlag(cmd, "draft"); value != "" {
			body.DraftText = param.NewOpt(value)
		}
		if value := firstFlag(cmd, "attachment"); value != "" {
			body.DraftAttachmentPath = param.NewOpt(value)
		}
		res, err := client.Focus(ctx, body)
		if err != nil {
			return err
		}
		return printData(opts, res)
	default:
		return fmt.Errorf("unhandled chat command %s", spec.Name)
	}
}

func resolveChatFromFlags(ctx context.Context, client beeperdesktopapi.Client, cmd *cobra.Command, args []string) (string, error) {
	selector := firstArgOrFlag(cmd, args, "chat")
	if selector == "" {
		selector = firstArgOrFlag(cmd, args, "to")
	}
	pick, _ := cmd.Flags().GetInt("pick")
	return resolveChatID(ctx, client, selector, pick)
}

type chatState struct {
	IsArchived     bool
	IsPinned       bool
	IsMuted        bool
	IsLowPriority  bool
	IsMarkedUnread bool
	UnreadCount    int64
}

func chatStateFromListResponse(chat beeperdesktopapi.ChatListResponse) chatState {
	return chatStateFromChat(chat.Chat)
}

func chatStateFromChat(chat beeperdesktopapi.Chat) chatState {
	return chatState{
		IsArchived:     chat.IsArchived,
		IsPinned:       chat.IsPinned,
		IsMuted:        chat.IsMuted,
		IsLowPriority:  chat.IsLowPriority,
		IsMarkedUnread: chat.IsMarkedUnread,
		UnreadCount:    chat.UnreadCount,
	}
}

func matchesChatStateFilters(cmd *cobra.Command, chat chatState) bool {
	return matchesBoolStateFilter(cmd, "archived", chat.IsArchived) &&
		matchesBoolStateFilter(cmd, "pinned", chat.IsPinned) &&
		matchesBoolStateFilter(cmd, "muted", chat.IsMuted) &&
		matchesBoolStateFilter(cmd, "low-priority", chat.IsLowPriority) &&
		matchesBoolStateFilter(cmd, "unread", chat.UnreadCount > 0 || chat.IsMarkedUnread)
}

func matchesBoolStateFilter(cmd *cobra.Command, name string, actual bool) bool {
	includeChanged := flagChanged(cmd, name)
	excludeChanged := flagChanged(cmd, "no-"+name)
	if includeChanged && excludeChanged {
		return false
	}
	if includeChanged {
		value, _ := cmd.Flags().GetBool(name)
		return actual == value
	}
	if excludeChanged {
		value, _ := cmd.Flags().GetBool("no-" + name)
		if !value {
			return true
		}
		return !actual
	}
	return true
}

func flagChanged(cmd *cobra.Command, name string) bool {
	flag := cmd.Flags().Lookup(name)
	return flag != nil && flag.Changed
}

func parseReminderTime(value string) (time.Time, error) {
	if value == "" {
		return time.Time{}, usageError("missing --at")
	}
	if ms, err := strconv.ParseFloat(value, 64); err == nil {
		return time.UnixMilli(int64(ms)), nil
	}
	if d, err := time.ParseDuration(value); err == nil {
		return time.Now().Add(d), nil
	}
	if t, err := time.Parse(time.RFC3339, value); err == nil {
		return t, nil
	}
	return time.Time{}, usageError("invalid --at %q; use Unix milliseconds, RFC3339, or duration like 2h", value)
}

func uploadAssetFromFlags(ctx context.Context, client beeperdesktopapi.Client, cmd *cobra.Command, path string) (*beeperdesktopapi.AssetUploadResponse, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()
	body := beeperdesktopapi.AssetUploadParams{File: file}
	if filename := firstFlag(cmd, "filename"); filename != "" {
		body.FileName = param.NewOpt(filename)
	}
	if mimeType := firstFlag(cmd, "mime"); mimeType != "" {
		body.MimeType = param.NewOpt(mimeType)
	}
	return client.Assets.Upload(ctx, body)
}

func draftAttachmentFromUpload(upload *beeperdesktopapi.AssetUploadResponse) beeperdesktopapi.ChatUpdateParamsDraftAttachment {
	attachment := beeperdesktopapi.ChatUpdateParamsDraftAttachment{
		UploadID: upload.UploadID,
		FileName: param.NewOpt(upload.FileName),
		MimeType: param.NewOpt(upload.MimeType),
	}
	if upload.Duration != 0 {
		attachment.Duration = param.NewOpt(upload.Duration)
	}
	if upload.Width != 0 || upload.Height != 0 {
		attachment.Size = beeperdesktopapi.ChatUpdateParamsDraftAttachmentSize{
			Width:  upload.Width,
			Height: upload.Height,
		}
	}
	return attachment
}

func defaultAccountID(ctx context.Context, client beeperdesktopapi.Client) (string, error) {
	accounts, err := client.Accounts.List(ctx)
	if err != nil {
		return "", err
	}
	ids := []string{}
	for _, account := range *accounts {
		if account.AccountID == "matrix" {
			return "matrix", nil
		}
		if account.AccountID != "" {
			ids = append(ids, account.AccountID)
		}
	}
	if len(ids) == 1 {
		return ids[0], nil
	}
	return "", usageError("use --account to choose which account should start the chat")
}

func userQueryFromInput(input string) beeperdesktopapi.ChatStartParamsUser {
	trimmed := strings.TrimSpace(input)
	user := beeperdesktopapi.ChatStartParamsUser{}
	if regexp.MustCompile(`^@[^:]+:.+`).MatchString(trimmed) {
		user.ID = param.NewOpt(trimmed)
		user.Username = param.NewOpt(trimmed)
		return user
	}
	if strings.Contains(trimmed, "@") {
		user.Email = param.NewOpt(trimmed)
		user.Username = param.NewOpt(trimmed)
		return user
	}
	if regexp.MustCompile(`^\+?[\d\s().-]{5,}$`).MatchString(trimmed) {
		user.PhoneNumber = param.NewOpt(trimmed)
		return user
	}
	user.FullName = param.NewOpt(trimmed)
	user.Username = param.NewOpt(trimmed)
	user.ID = param.NewOpt(trimmed)
	return user
}
