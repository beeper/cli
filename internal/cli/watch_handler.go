package cli

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"

	beeperdesktopapi "github.com/beeper/desktop-api-go/v5"
	"github.com/beeper/desktop-api-go/v5/option"
	"github.com/coder/websocket"
	"github.com/spf13/cobra"
)

type webhookItem struct {
	body      []byte
	signature string
}

type webhookForwarder struct {
	url    string
	secret string
	max    int
	events bool

	client   *http.Client
	errOut   func(string, ...any)
	mu       sync.Mutex
	queue    []webhookItem
	inflight int
	draining bool
}

func runWatchCommand(opts *globalOptions, cmd *cobra.Command, args []string) error {
	include, _ := cmd.Flags().GetStringArray("include-type")
	exclude, _ := cmd.Flags().GetStringArray("exclude-type")
	if len(include) > 0 && len(exclude) > 0 {
		return usageError("Use either --include-type or --exclude-type, not both.")
	}
	webhookURL := firstFlag(cmd, "webhook")
	webhookSecret := firstFlag(cmd, "webhook-secret")
	if webhookSecret != "" && webhookURL == "" {
		return usageError("--webhook-secret requires --webhook URL")
	}
	var webhook *webhookForwarder
	if webhookURL != "" {
		queueMax, _ := cmd.Flags().GetInt("webhook-queue")
		if queueMax <= 0 {
			queueMax = 64
		}
		webhook = newWebhookForwarder(webhookURL, webhookSecret, queueMax, opts.Events)
	}
	target, err := resolveTarget(opts)
	if err != nil {
		return err
	}
	chats, _ := cmd.Flags().GetStringArray("chat")
	if len(chats) == 0 {
		chats = []string{"*"}
	} else if !stringSliceOnly(chats, "*") {
		client, ctx, cancel, err := newClient(opts)
		if err != nil {
			return err
		}
		defer cancel()
		resolved := make([]string, 0, len(chats))
		for _, chat := range chats {
			if chat == "*" {
				resolved = append(resolved, chat)
				continue
			}
			chatID, err := resolveChatID(ctx, client, chat, 0)
			if err != nil {
				return err
			}
			resolved = append(resolved, chatID)
		}
		chats = resolved
	}
	infoClient := beeperdesktopapi.NewClient(option.WithBaseURL(target.BaseURL), option.WithAccessToken(""))
	info, err := infoClient.Info.Get(context.Background())
	if err != nil {
		return err
	}
	endpoint := info.Endpoints.WsEvents
	if endpoint == "" {
		return usageError("selected target does not expose a typed WebSocket events endpoint in /v1/info")
	}
	wsURL, err := url.Parse(endpoint)
	if err != nil {
		return err
	}
	if !wsURL.IsAbs() {
		base, _ := url.Parse(target.BaseURL)
		wsURL = base.ResolveReference(wsURL)
	}
	if wsURL.Scheme == "https" {
		wsURL.Scheme = "wss"
	} else {
		wsURL.Scheme = "ws"
	}
	headers := http.Header{}
	if target.Auth != nil && target.Auth.AccessToken != "" {
		headers.Set("authorization", "Bearer "+target.Auth.AccessToken)
	}
	conn, _, err := websocket.Dial(context.Background(), wsURL.String(), &websocket.DialOptions{HTTPHeader: headers})
	if err != nil {
		return err
	}
	defer conn.Close(websocket.StatusNormalClosure, "")
	if opts.Events {
		writeEvent("watch.open", map[string]any{"subscribed": chats})
	}
	subscription, _ := json.Marshal(map[string]any{"type": "subscriptions.set", "chatIDs": chats})
	if err := conn.Write(context.Background(), websocket.MessageText, subscription); err != nil {
		return err
	}
	for {
		_, data, err := conn.Read(context.Background())
		if err != nil {
			return err
		}
		if !watchPassesFilter(data, cmd) {
			continue
		}
		if opts.Events {
			writeEvent("watch.message", nil)
		}
		cmd.OutOrStdout().Write(data)
		cmd.OutOrStdout().Write([]byte("\n"))
		if webhook != nil {
			webhook.forward(data)
		}
	}
}

func stringSliceOnly(values []string, needle string) bool {
	for _, value := range values {
		if value != needle {
			return false
		}
	}
	return len(values) > 0
}

func watchPassesFilter(data []byte, cmd *cobra.Command) bool {
	include, _ := cmd.Flags().GetStringArray("include-type")
	exclude, _ := cmd.Flags().GetStringArray("exclude-type")
	if len(include) == 0 && len(exclude) == 0 {
		return true
	}
	var event struct {
		Type string `json:"type"`
	}
	if json.Unmarshal(data, &event) != nil || event.Type == "" {
		return true
	}
	for _, value := range exclude {
		if value == event.Type {
			return false
		}
	}
	if len(include) == 0 {
		return true
	}
	for _, value := range include {
		if value == event.Type {
			return true
		}
	}
	return false
}

func newWebhookForwarder(webhookURL, secret string, max int, events bool) *webhookForwarder {
	if max <= 0 {
		max = 64
	}
	return &webhookForwarder{
		url:    webhookURL,
		secret: secret,
		max:    max,
		events: events,
		client: &http.Client{Timeout: 10 * time.Second},
		errOut: func(format string, args ...any) {
			fmt.Fprintf(os.Stderr, format, args...)
		},
	}
}

func (w *webhookForwarder) forward(body []byte) {
	if w == nil {
		return
	}
	item := webhookItem{body: append([]byte(nil), body...)}
	if w.secret != "" {
		mac := hmac.New(sha256.New, []byte(w.secret))
		mac.Write(body)
		item.signature = "sha256=" + hex.EncodeToString(mac.Sum(nil))
	}
	w.mu.Lock()
	if w.inflight+len(w.queue) >= w.max {
		size := len(w.queue)
		w.mu.Unlock()
		if w.events {
			writeEvent("watch.webhook_drop", map[string]any{"reason": "queue_full", "size": size})
		}
		w.errOut("warning: webhook queue full (%d); dropped event\n", w.max)
		return
	}
	w.queue = append(w.queue, item)
	if w.draining {
		w.mu.Unlock()
		return
	}
	w.draining = true
	w.mu.Unlock()
	go w.drain()
}

func (w *webhookForwarder) drain() {
	for {
		w.mu.Lock()
		if len(w.queue) == 0 {
			w.draining = false
			w.mu.Unlock()
			return
		}
		item := w.queue[0]
		w.queue = w.queue[1:]
		w.inflight++
		w.mu.Unlock()

		w.post(item)

		w.mu.Lock()
		w.inflight--
		w.mu.Unlock()
	}
}

func (w *webhookForwarder) post(item webhookItem) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, w.url, strings.NewReader(string(item.body)))
	if err != nil {
		if w.events {
			writeEvent("watch.webhook_error", map[string]any{"message": err.Error()})
		}
		w.errOut("warning: webhook POST failed: %s\n", err.Error())
		return
	}
	req.Header.Set("content-type", "application/json")
	if item.signature != "" {
		req.Header.Set("x-beeper-signature", item.signature)
	}
	res, err := w.client.Do(req)
	if err != nil {
		if w.events {
			writeEvent("watch.webhook_error", map[string]any{"message": err.Error()})
		}
		w.errOut("warning: webhook POST failed: %s\n", err.Error())
		return
	}
	defer res.Body.Close()
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		if w.events {
			writeEvent("watch.webhook_error", map[string]any{"status": res.StatusCode})
		}
		w.errOut("warning: webhook POST %s returned %d\n", w.url, res.StatusCode)
	}
}
