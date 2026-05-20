package desktopapi

import (
	"context"
	"net/url"
	"strings"

	beeperdesktopapi "github.com/beeper/desktop-api-go/v5"
)

type TypingState string

const (
	TypingStateTyping TypingState = "typing"
	TypingStatePaused TypingState = "paused"
)

type SetTypingParams struct {
	State TypingState `json:"state"`
}

type SetTypingResponse struct {
	ChatID string      `json:"chatID"`
	State  TypingState `json:"state"`
}

type ChatTypingService struct {
	client beeperdesktopapi.Client
}

func NewChatTypingService(client beeperdesktopapi.Client) ChatTypingService {
	return ChatTypingService{client: client}
}

func (s ChatTypingService) Set(ctx context.Context, chatID string, params SetTypingParams) (*SetTypingResponse, error) {
	var out SetTypingResponse
	path := "v1/chats/" + escapePathSegment(chatID) + "/typing"
	if err := s.client.Post(ctx, path, params, &out); err != nil {
		return nil, err
	}
	if out.ChatID == "" {
		out.ChatID = chatID
	}
	if out.State == "" {
		out.State = params.State
	}
	return &out, nil
}

func SetTyping(ctx context.Context, client beeperdesktopapi.Client, chatID string, params SetTypingParams) (*SetTypingResponse, error) {
	return NewChatTypingService(client).Set(ctx, chatID, params)
}

func escapePathSegment(value string) string {
	return strings.ReplaceAll(url.PathEscape(value), ":", "%3A")
}
