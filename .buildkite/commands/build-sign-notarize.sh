#!/usr/bin/env bash

set -euo pipefail

bun_version="$(sed -nE 's/.*"packageManager": *"bun@([^"]+)".*/\1/p' package.json)"
if [ -z "$bun_version" ]; then
  echo >&2 "could not read the Bun version from package.json's packageManager"
  exit 1
fi

echo "--- :bun: install Bun $bun_version"
curl -fsSL https://bun.sh/install | bash -s "bun-v$bun_version"
export PATH="$HOME/.bun/bin:$PATH"
bun --version

echo "--- :package: install dependencies"
bun install --frozen-lockfile

echo "--- :hammer_and_wrench: build binaries"
bun run --cwd packages/cli binary

bin_dir="packages/cli/dist/bin"

echo "--- :key: set up Ruby tooling"
install_gems

echo "--- :closed_lock_with_key: sign and notarize macOS binaries"
bundle exec fastlane configure_code_signing
bundle exec fastlane sign_macos_binaries

echo "--- :mag: check binaries.json checksums"
ruby -rjson -e '
  JSON.parse(File.read(ARGV.fetch(0))).fetch("artifacts").each do |artifact|
    puts "#{artifact.fetch("sha256")}  #{artifact.fetch("file")}"
  end
' "$bin_dir/binaries.json" | (cd "$bin_dir" && shasum -a 256 -c -)

echo "--- :package: archive binaries"

# dist/ is gitignored, and the step's `artifact_paths` glob picks it up even if a
# later command fails.
mkdir -p dist

# Buildkite artifacts carry bytes, not file modes, so a bare binary downloads
# without its executable bit. Tar records the mode; extraction restores it.
tar -czf dist/beeper-cli-binaries.tar.gz -C "$bin_dir" \
  binaries.json beeper-darwin-arm64 beeper-darwin-x64 beeper-linux-arm64 beeper-linux-x64
cp "$bin_dir/binaries.json" dist/binaries.json
