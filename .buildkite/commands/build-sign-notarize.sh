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

echo "--- :package: build release archives"
# binaries.json records absolute paths on this agent, so the archives must be built here.
bun run --cwd packages/cli scripts/build-homebrew-archive.ts
