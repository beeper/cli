#!/usr/bin/env node
import {existsSync} from 'node:fs';
import {mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn} from 'node:child_process';

const root = new URL('..', import.meta.url).pathname;
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const metadata = JSON.parse(await readFile(new URL('../dist/release/homebrew.json', import.meta.url), 'utf8'));

const token = process.env.HOMEBREW_TAP_GITHUB_TOKEN;
const tapRepository = process.env.HOMEBREW_TAP_REPOSITORY || 'beeper/homebrew-tap';
const sourceRepository = process.env.GITHUB_REPOSITORY || 'beeper/desktop-api-cli';
const version = process.env.PACKAGE_VERSION || metadata.version || packageJson.version;
const formulaName = process.env.HOMEBREW_FORMULA_NAME || 'beeper-cli';
const commandName = process.env.HOMEBREW_COMMAND_NAME || metadata.command || 'beeper';
const formulaClass = formulaName
  .split(/[-_]/)
  .map(part => `${part[0].toUpperCase()}${part.slice(1)}`)
  .join('');
const tag = process.env.GITHUB_REF_NAME || `v${version}`;

if (!token) {
  throw new Error('HOMEBREW_TAP_GITHUB_TOKEN is required to publish the Homebrew formula.');
}

const cloneRoot = await mkdtemp(join(tmpdir(), 'beeper-cli-homebrew-'));
const tapPath = join(cloneRoot, 'tap');
const remote = `https://x-access-token:${token}@github.com/${tapRepository}.git`;

try {
  await run('git', ['clone', '--depth', '1', remote, tapPath], {cwd: cloneRoot, scrub: token});
  await run('git', ['config', 'user.name', process.env.GIT_AUTHOR_NAME || 'beeper-release-bot'], {cwd: tapPath});
  await run('git', ['config', 'user.email', process.env.GIT_AUTHOR_EMAIL || 'help@beeper.com'], {cwd: tapPath});

  const formulaDir = join(tapPath, 'Formula');
  const formulaPath = join(formulaDir, `${formulaName}.rb`);
  if (!existsSync(formulaDir)) {
    await mkdir(formulaDir, {recursive: true});
  }

  await writeFile(
    formulaPath,
    formula({formulaClass, formulaName, sourceRepository, tag, version, metadata, commandName}),
  );
  await run('git', ['add', formulaPath], {cwd: tapPath});

  const changed = await output('git', ['diff', '--cached', '--quiet'], {cwd: tapPath, allowFailure: true});
  if (changed.code === 0) {
    console.log('Homebrew formula is already current.');
  } else {
    await run('git', ['commit', '-m', `${formulaName} ${version}`], {cwd: tapPath});
    await run('git', ['push', 'origin', 'HEAD'], {cwd: tapPath, scrub: token});
  }
} finally {
  await rm(cloneRoot, {recursive: true, force: true});
}

function formula({formulaClass, formulaName, sourceRepository, tag, version, metadata, commandName}) {
  const archives = metadata.archives ?? [metadata]
  const arm64 = archives.find(archive => archive.platform === 'darwin-arm64') ?? archives[0]
  const x64 = archives.find(archive => archive.platform === 'darwin-x64') ?? arm64

  return `class ${formulaClass} < Formula
  desc "Beeper CLI"
  homepage "https://developers.beeper.com/desktop-api/"
  license "MIT"
  version "${version}"

  on_arm do
    url "https://github.com/${sourceRepository}/releases/download/${tag}/${arm64.archive}"
    sha256 "${arm64.sha256}"
  end

  on_intel do
    url "https://github.com/${sourceRepository}/releases/download/${tag}/${x64.archive}"
    sha256 "${x64.sha256}"
  end

  def install
    bin.install "bin/${commandName}"
    bin.install_symlink bin/"${commandName}" => "${formulaName}"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/${commandName} --version")
  end
end
`;
}

async function run(command, args, options = {}) {
  const result = await output(command, args, options);
  if (result.code !== 0) {
    throw new Error(`${command} ${args.join(' ')} exited with ${result.code}`);
  }
}

async function output(command, args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd || root,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(options.scrub ? text.replaceAll(options.scrub, '[token]') : text);
    });
    child.stderr.on('data', chunk => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(options.scrub ? text.replaceAll(options.scrub, '[token]') : text);
    });
    child.on('error', reject);
    child.on('exit', code => {
      if (code !== 0 && !options.allowFailure) {
        resolvePromise({code, stdout, stderr});
        return;
      }

      resolvePromise({code, stdout, stderr});
    });
  });
}
