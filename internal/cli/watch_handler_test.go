package cli

import (
	"bytes"
	"io"
	"net/http"
	"strings"
	"sync"
	"testing"
	"time"
)

func TestWatchPassesFilter(t *testing.T) {
	cmd := NewRootCommand()
	watch, _, err := cmd.Find([]string{"watch"})
	if err != nil {
		t.Fatal(err)
	}
	body := []byte(`{"type":"message.upserted","chatID":"!x:beeper.com"}`)
	if !watchPassesFilter(body, watch) {
		t.Fatal("expected unfiltered event to pass")
	}
	watch.Flags().Set("include-type", "message.upserted")
	if !watchPassesFilter(body, watch) {
		t.Fatal("expected included event to pass")
	}
	if watchPassesFilter([]byte(`{"type":"chat.deleted"}`), watch) {
		t.Fatal("expected non-included event to be filtered")
	}
	if !watchPassesFilter([]byte(`{"chatID":"x"}`), watch) {
		t.Fatal("expected event without type to pass through")
	}
	if !watchPassesFilter([]byte(`not json`), watch) {
		t.Fatal("expected unparseable event to pass through")
	}
}

func TestWebhookForwarderSignsAndPosts(t *testing.T) {
	var gotBody, gotSignature string
	done := make(chan struct{})
	forwarder := newWebhookForwarder("https://example.invalid/webhook", "secret", 4, false)
	forwarder.client = &http.Client{Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
		buf := new(bytes.Buffer)
		buf.ReadFrom(r.Body)
		gotBody = buf.String()
		gotSignature = r.Header.Get("x-beeper-signature")
		close(done)
		return &http.Response{StatusCode: 204, Body: io.NopCloser(strings.NewReader(""))}, nil
	})}
	var warnings bytes.Buffer
	forwarder.errOut = func(format string, args ...any) {
		warnings.WriteString(strings.TrimSpace(format))
	}
	forwarder.forward([]byte(`{"type":"message.upserted"}`))

	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Fatal("webhook was not delivered")
	}
	if gotBody != `{"type":"message.upserted"}` {
		t.Fatalf("unexpected body: %s", gotBody)
	}
	wantSignature := "sha256=24dddf79ed42fb690d85fba5af11ed01ad8e4ea49c75dd6c4c6a0353f19204d7"
	if gotSignature != wantSignature {
		t.Fatalf("unexpected signature: %s", gotSignature)
	}
	if warnings.Len() != 0 {
		t.Fatalf("unexpected warning: %s", warnings.String())
	}
}

func TestWebhookForwarderDropsWhenQueueFull(t *testing.T) {
	block := make(chan struct{})
	var mu sync.Mutex
	received := 0
	forwarder := newWebhookForwarder("https://example.invalid/webhook", "", 1, false)
	forwarder.client = &http.Client{Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
		mu.Lock()
		received++
		mu.Unlock()
		<-block
		return &http.Response{StatusCode: 204, Body: io.NopCloser(strings.NewReader(""))}, nil
	})}
	defer close(block)

	var warnings bytes.Buffer
	forwarder.errOut = func(format string, args ...any) {
		warnings.WriteString(format)
	}
	forwarder.forward([]byte(`{"type":"message.upserted"}`))
	deadline := time.Now().Add(2 * time.Second)
	for {
		mu.Lock()
		started := received > 0
		mu.Unlock()
		if started || time.Now().After(deadline) {
			break
		}
		time.Sleep(10 * time.Millisecond)
	}
	forwarder.forward([]byte(`{"type":"message.deleted"}`))

	if !strings.Contains(warnings.String(), "webhook queue full") {
		t.Fatalf("missing queue warning: %s", warnings.String())
	}
}

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(r *http.Request) (*http.Response, error) {
	return f(r)
}
