package desktopapi

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"testing"

	beeperdesktopapi "github.com/beeper/desktop-api-go/v5"
	"github.com/beeper/desktop-api-go/v5/option"
)

func TestChatTypingServiceSet(t *testing.T) {
	transport := &captureTransport{body: `{"chatID":"local-chat","state":"typing"}`}

	client := beeperdesktopapi.NewClient(
		option.WithBaseURL("https://desktop-api.test"),
		option.WithAccessToken("test-token"),
		option.WithHTTPClient(&http.Client{Transport: transport}),
	)
	res, err := NewChatTypingService(client).Set(context.Background(), "local-chat", SetTypingParams{State: TypingStateTyping})
	if err != nil {
		t.Fatalf("Set returned error: %v", err)
	}
	if transport.method != http.MethodPost {
		t.Fatalf("method = %q, want %q", transport.method, http.MethodPost)
	}
	if transport.path != "/v1/chats/local-chat/typing" {
		t.Fatalf("path = %q", transport.path)
	}
	var gotBody SetTypingParams
	if err := json.Unmarshal(transport.requestBody, &gotBody); err != nil {
		t.Fatalf("decode request body: %v", err)
	}
	if gotBody.State != TypingStateTyping {
		t.Fatalf("state = %q", gotBody.State)
	}
	if res.ChatID != "local-chat" || res.State != TypingStateTyping {
		t.Fatalf("response = %#v", res)
	}
}

func TestChatTypingServiceEscapesChatID(t *testing.T) {
	transport := &captureTransport{body: `{}`}

	client := beeperdesktopapi.NewClient(
		option.WithBaseURL("https://desktop-api.test"),
		option.WithAccessToken("test-token"),
		option.WithHTTPClient(&http.Client{Transport: transport}),
	)
	chatID := "!NCdzlIaMjZUmvmvyHU:beeper.com"
	res, err := SetTyping(context.Background(), client, chatID, SetTypingParams{State: TypingStatePaused})
	if err != nil {
		t.Fatalf("SetTyping returned error: %v", err)
	}
	if transport.path != "/v1/chats/%21NCdzlIaMjZUmvmvyHU%3Abeeper.com/typing" {
		t.Fatalf("path = %q", transport.path)
	}
	if res.ChatID != chatID || res.State != TypingStatePaused {
		t.Fatalf("fallback response = %#v", res)
	}
}

type captureTransport struct {
	method      string
	path        string
	requestBody []byte
	body        string
}

func (t *captureTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	t.method = req.Method
	t.path = req.URL.EscapedPath()
	if req.Body != nil {
		body, err := io.ReadAll(req.Body)
		if err != nil {
			return nil, err
		}
		t.requestBody = body
	}
	return &http.Response{
		StatusCode: http.StatusOK,
		Status:     "200 OK",
		Header:     http.Header{"Content-Type": []string{"application/json"}},
		Body:       io.NopCloser(bytes.NewBufferString(t.body)),
		Request:    req,
	}, nil
}
