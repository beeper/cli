package cli

import (
	"archive/zip"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestLaunchAgentPlistEscapesAndIncludesServerArgs(t *testing.T) {
	t.Setenv("BEEPER_CLI_CONFIG_DIR", t.TempDir())
	profile := target{
		ID:        "server-test",
		Type:      "server",
		Managed:   true,
		DataDir:   "/tmp/beeper & data",
		BaseURL:   "http://127.0.0.1:24444",
		Port:      24444,
		ServerEnv: "staging",
	}
	plist := launchAgentPlist(profile, "/opt/beeper server/bin/beeper-server")
	for _, want := range []string{
		"<key>Label</key><string>com.beeper.cli.profile.server-test</string>",
		"<string>/opt/beeper server/bin/beeper-server</string>",
		"<string>--port=24444</string>",
		"<string>--server-env=staging</string>",
		"<string>/tmp/beeper &amp; data</string>",
	} {
		if !strings.Contains(plist, want) {
			t.Fatalf("plist missing %q:\n%s", want, plist)
		}
	}
}

func TestSystemdUnitIncludesServerArgs(t *testing.T) {
	t.Setenv("BEEPER_CLI_CONFIG_DIR", t.TempDir())
	profile := target{
		ID:        "server-test",
		Type:      "server",
		Managed:   true,
		DataDir:   "/tmp/beeper data",
		BaseURL:   "http://127.0.0.1:24444",
		Port:      24444,
		ServerEnv: "staging",
	}
	unit := systemdUnit(profile, "/opt/beeper server/bin/beeper-server")
	for _, want := range []string{
		"Description=Beeper profile server-test",
		`ExecStart="/opt/beeper server/bin/beeper-server" --host=127.0.0.1 --port=24444 "--data-dir=/tmp/beeper data" --server-env=staging`,
		`Environment=BEEPER_SERVER_DATA_DIR="/tmp/beeper data"`,
		"Restart=always",
	} {
		if !strings.Contains(unit, want) {
			t.Fatalf("unit missing %q:\n%s", want, unit)
		}
	}
}

func TestExtractDesktopArtifactFindsAppBundleInZip(t *testing.T) {
	dir := t.TempDir()
	zipPath := filepath.Join(dir, "desktop.zip")
	archive, err := os.Create(zipPath)
	if err != nil {
		t.Fatal(err)
	}
	zw := zip.NewWriter(archive)
	file, err := zw.Create("Payload/Beeper.app/Contents/Info.plist")
	if err != nil {
		t.Fatal(err)
	}
	if _, err := file.Write([]byte("<plist/>")); err != nil {
		t.Fatal(err)
	}
	if err := zw.Close(); err != nil {
		t.Fatal(err)
	}
	if err := archive.Close(); err != nil {
		t.Fatal(err)
	}

	outDir := filepath.Join(dir, "out")
	appPath, err := extractDesktopArtifact(zipPath, outDir)
	if err != nil {
		t.Fatalf("extractDesktopArtifact returned error: %v", err)
	}
	if filepath.Base(appPath) != "Beeper.app" {
		t.Fatalf("app path = %q", appPath)
	}
	if _, err := os.Stat(filepath.Join(appPath, "Contents", "Info.plist")); err != nil {
		t.Fatalf("missing copied app file: %v", err)
	}
}
