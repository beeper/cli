#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { createWriteStream, existsSync } from 'node:fs'
import { chmod, mkdir, readFile, rename, rm } from 'node:fs/promises'
import { get } from 'node:https'
import { homedir, tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const pkg = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'))
const version = pkg.version
const platform = normalizePlatform(process.platform)
const arch = normalizeArch(process.arch)
const extension = platform === 'windows' ? '.exe' : ''
const executableName = `beeper-${platform}-${arch}${extension}`
const releaseTag = process.env.BEEPER_CLI_RELEASE_TAG || `v${version}`
const releaseRepository = process.env.GITHUB_REPOSITORY || 'beeper/cli'
const releaseBaseURL = (process.env.BEEPER_CLI_RELEASE_BASE_URL || `https://github.com/${releaseRepository}/releases/download/${releaseTag}`).replace(/\/$/, '')
const cacheRoot = process.env.BEEPER_CLI_BINARY_CACHE_DIR || join(homedir(), '.cache', 'beeper-cli')
const cacheDir = join(cacheRoot, version, `${platform}-${arch}`)
const cachedExecutable = join(cacheDir, platform === 'windows' ? 'beeper.exe' : 'beeper')

try {
  const executable = await ensureExecutable()
  const child = spawn(executable, process.argv.slice(2), {
    env: process.env,
    stdio: 'inherit',
  })
  child.once('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal)
    process.exit(code ?? 1)
  })
  child.once('error', error => {
    console.error(`beeper-cli: failed to start downloaded binary: ${error.message}`)
    process.exit(1)
  })
} catch (error) {
  console.error(`beeper-cli: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}

async function ensureExecutable() {
  if (existsSync(cachedExecutable)) return cachedExecutable

  await mkdir(cacheDir, { recursive: true })
  const tmpPath = join(tmpdir(), `${executableName}.${process.pid}.${Date.now()}.download`)
  const url = `${releaseBaseURL}/${executableName}`
  console.error(`beeper-cli: downloading ${url}`)
  await download(url, tmpPath)

  const expectedHash = await fetchExpectedHash().catch(() => undefined)
  if (expectedHash) {
    const actualHash = await sha256(tmpPath)
    if (actualHash !== expectedHash) {
      await rm(tmpPath, { force: true })
      throw new Error(`downloaded binary checksum mismatch for ${executableName}`)
    }
  } else if (process.env.BEEPER_CLI_REQUIRE_CHECKSUM === '1') {
    await rm(tmpPath, { force: true })
    throw new Error(`no checksum found for ${executableName}`)
  }

  if (platform !== 'windows') await chmod(tmpPath, 0o755)
  await rename(tmpPath, cachedExecutable)
  return cachedExecutable
}

function normalizePlatform(value) {
  if (value === 'darwin') return 'darwin'
  if (value === 'linux') return 'linux'
  if (value === 'win32') return 'windows'
  throw new Error(`unsupported platform: ${value}`)
}

function normalizeArch(value) {
  if (value === 'x64') return 'x64'
  if (value === 'arm64') return 'arm64'
  throw new Error(`unsupported architecture: ${value}`)
}

async function fetchExpectedHash() {
  const manifestURL = `${releaseBaseURL}/binaries.json`
  const manifestPath = join(tmpdir(), `beeper-cli-binaries-${version}-${process.pid}-${Date.now()}.json`)
  try {
    await download(manifestURL, manifestPath, { quiet: true })
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
    return manifest.artifacts?.find(artifact => artifact.file === executableName)?.sha256
  } finally {
    await rm(manifestPath, { force: true })
  }
}

async function download(url, destination, options = {}) {
  await mkdir(dirname(destination), { recursive: true })
  await new Promise((resolve, reject) => {
    const request = get(url, response => {
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume()
        download(new URL(response.headers.location, url).toString(), destination, options).then(resolve, reject)
        return
      }
      if (response.statusCode !== 200) {
        response.resume()
        reject(new Error(`download failed for ${basename(url)}: HTTP ${response.statusCode}`))
        return
      }
      pipeline(response, createWriteStream(destination)).then(resolve, reject)
    })
    request.once('error', reject)
    request.setTimeout(120_000, () => request.destroy(new Error(`download timed out: ${url}`)))
  })
}

async function sha256(path) {
  return createHash('sha256').update(await readFile(path)).digest('hex')
}
