package cloudflare

import (
	"os"
	"testing"
)

func TestVersionIsGreaterThan(t *testing.T) {
	if !VersionIsGreaterThan("2024.8.2", "2024.8.1") {
		t.Fatal("expected newer patch to compare greater")
	}
	if VersionIsGreaterThan("2024.8.2", "2024.8.2") {
		t.Fatal("equal versions should not compare greater")
	}
	if VersionIsGreaterThan("2024.8.2", "2024.9.0") {
		t.Fatal("older minor should not compare greater")
	}
}

func TestFindTunnelURL(t *testing.T) {
	if got := FindTunnelURL("INF https://example.trycloudflare.com ready", "trycloudflare.com"); got != "https://example.trycloudflare.com" {
		t.Fatalf("unexpected tunnel URL: %q", got)
	}
	if got := FindTunnelURL("INF https://example.example.com ready", "trycloudflare.com"); got != "" {
		t.Fatalf("unexpected tunnel URL for wrong domain: %q", got)
	}
}

func TestKnownErrorAndDomain(t *testing.T) {
	if got := FindKnownError("2024-01-01 ERR Failed to serve quic connection connIndex=1"); got == "" {
		t.Fatal("expected known error")
	}
	t.Setenv("BEEPER_CLOUDFLARED_DOMAIN", "beeper.test")
	if got := CloudflaredDomain(); got != "beeper.test" {
		t.Fatalf("unexpected domain: %q", got)
	}
	if !truthy("yes") || truthy("no") {
		t.Fatal("truthy parser mismatch")
	}
	_ = os.Unsetenv("BEEPER_CLOUDFLARED_DOMAIN")
}
