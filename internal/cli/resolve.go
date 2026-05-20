package cli

import (
	"context"
	"fmt"
	"strings"

	beeperdesktopapi "github.com/beeper/desktop-api-go/v5"
	"github.com/beeper/desktop-api-go/v5/packages/param"
)

func resolveChatID(ctx context.Context, client beeperdesktopapi.Client, input string, pick int) (string, error) {
	if input == "" {
		return "", usageError("missing chat selector")
	}
	if strings.HasPrefix(input, "!") {
		return input, nil
	}
	if chat, err := client.Chats.Get(ctx, input, beeperdesktopapi.ChatGetParams{MaxParticipantCount: param.NewOpt[int64](0)}); err == nil && chat != nil {
		return chatInputID(*chat), nil
	}

	pager := client.Chats.SearchAutoPaging(ctx, beeperdesktopapi.ChatSearchParams{
		Query: param.NewOpt(input),
		Scope: beeperdesktopapi.ChatSearchParamsScopeTitles,
		Limit: param.NewOpt[int64](10),
	})
	candidates := []beeperdesktopapi.Chat{}
	for pager.Next() {
		candidates = append(candidates, pager.Current())
		if len(candidates) >= 10 {
			break
		}
	}
	if err := pager.Err(); err != nil {
		return "", err
	}
	normalizedInput := normalizeSelector(input)
	exact := []beeperdesktopapi.Chat{}
	for _, chat := range candidates {
		if normalizeSelector(chat.ID) == normalizedInput || normalizeSelector(chat.LocalChatID) == normalizedInput || normalizeSelector(chat.Title) == normalizedInput {
			exact = append(exact, chat)
		}
	}
	matches := candidates
	if len(exact) > 0 {
		matches = exact
	}
	if len(matches) == 0 {
		return input, nil
	}
	if len(matches) == 1 {
		return chatInputID(matches[0]), nil
	}
	if pick > 0 {
		if pick > len(matches) {
			return "", usageError("--pick %d is outside the %d matching chats", pick, len(matches))
		}
		return chatInputID(matches[pick-1]), nil
	}
	lines := []string{fmt.Sprintf("ambiguous chat %q. Use an exact ID or --pick N:", input)}
	for i, chat := range matches {
		lines = append(lines, fmt.Sprintf("  %d. %s", i+1, formatChatChoice(chat)))
	}
	return "", usageError("%s", strings.Join(lines, "\n"))
}

func chatInputID(chat beeperdesktopapi.Chat) string {
	if chat.LocalChatID != "" {
		return chat.LocalChatID
	}
	return chat.ID
}

func formatChatChoice(chat beeperdesktopapi.Chat) string {
	local := ""
	if chat.LocalChatID != "" {
		local = " local:" + chat.LocalChatID
	}
	return strings.TrimSpace(chat.ID + local + " " + chat.Title)
}

func normalizeSelector(value string) string {
	value = strings.TrimSpace(strings.ToLower(value))
	replacer := strings.NewReplacer(" ", "", ".", "", "_", "", "-", "")
	return replacer.Replace(value)
}
