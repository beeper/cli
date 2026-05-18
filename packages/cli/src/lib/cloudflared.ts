import { execFile, spawn, type ChildProcess } from 'node:child_process'
import { chmod, mkdir, rename, rm, stat } from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import { dirname, join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { promisify } from 'node:util'
import { Writable } from 'node:stream'
import { beeperDir } from './targets.js'

const execFileAsync = promisify(execFile)

export const CLOUDFLARED_VERSION = '2024.8.2'
const RELEASE_BASE = `https://github.com/cloudflare/cloudflared/releases/download/${CLOUDFLARED_VERSION}/`

const FILES: Record<string, Record<string, string>> = {
  linux: { arm64: 'cloudflared-linux-arm64', arm: 'cloudflared-linux-arm', x64: 'cloudflared-linux-amd64', ia32: 'cloudflared-linux-386' },
  darwin: { arm64: 'cloudflared-darwin-arm64.tgz', x64: 'cloudflared-darwin-amd64.tgz' },
  win32: { x64: 'cloudflared-windows-amd64.exe', ia32: 'cloudflared-windows-386.exe', arm64: 'cloudflared-windows-amd64.exe' },
}

export function cloudflaredBinPath(): string {
  if (process.env.BEEPER_CLOUDFLARED_PATH) return process.env.BEEPER_CLOUDFLARED_PATH
  return join(beeperDir(), 'bin', process.platform === 'win32' ? 'cloudflared.exe' : 'cloudflared')
}

export function downloadURL(platform = process.platform, arch = process.arch): string {
  const byArch = FILES[platform]
  if (!byArch) throw new Error(`Unsupported platform for cloudflared: ${platform}`)
  const file = byArch[arch]
  if (!file) throw new Error(`Unsupported arch for cloudflared: ${arch}`)
  return RELEASE_BASE + file
}

export async function ensureCloudflared(options: { onProgress?: (msg: string) => void } = {}): Promise<string> {
  if (process.env.BEEPER_IGNORE_CLOUDFLARED) throw new Error('Cloudflared install skipped (BEEPER_IGNORE_CLOUDFLARED set)')
  const bin = cloudflaredBinPath()
  if (await currentVersionOK(bin)) return bin

  const url = downloadURL()
  const platform = process.platform
  options.onProgress?.(`Installing cloudflared ${CLOUDFLARED_VERSION} from ${url}`)
  await mkdir(dirname(bin), { recursive: true })

  if (platform === 'darwin') {
    const tgz = `${bin}.tgz`
    await download(url, tgz)
    await execFileAsync('tar', ['-xzf', tgz], { cwd: dirname(bin) })
    await rm(tgz, { force: true })
    await rename(join(dirname(bin), 'cloudflared'), bin)
    await chmod(bin, 0o755)
  } else if (platform === 'linux') {
    await download(url, bin)
    await chmod(bin, 0o755)
  } else if (platform === 'win32') {
    await download(url, bin)
  } else {
    throw new Error(`Unsupported platform: ${platform}`)
  }
  return bin
}

async function currentVersionOK(bin: string): Promise<boolean> {
  try {
    await stat(bin)
    const { stdout } = await execFileAsync(bin, ['--version'], { encoding: 'utf8' })
    const parts = stdout.split(/\s+/)
    const version = parts[2] ?? '0.0.0'
    return !versionGreater(CLOUDFLARED_VERSION, version)
  } catch {
    return false
  }
}

function versionGreater(a: string, b: string): boolean {
  const [aMaj, aMin, aPat] = a.split('.').map(n => Number(n) || 0)
  const [bMaj, bMin, bPat] = b.split('.').map(n => Number(n) || 0)
  if (aMaj !== bMaj) return (aMaj ?? 0) > (bMaj ?? 0)
  if (aMin !== bMin) return (aMin ?? 0) > (bMin ?? 0)
  return (aPat ?? 0) > (bPat ?? 0)
}

async function download(url: string, to: string): Promise<void> {
  const response = await fetch(url, { redirect: 'follow' })
  if (!response.ok || !response.body) throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`)
  await pipeline(response.body as unknown as NodeJS.ReadableStream, createWriteStream(to))
}

export type TunnelStatus =
  | { state: 'starting' }
  | { state: 'connected'; url: string }
  | { state: 'error'; message: string }
  | { state: 'stopped' }

export type TunnelHandle = {
  port: number
  getStatus: () => TunnelStatus
  waitForURL: (timeoutMs?: number) => Promise<string>
  stop: () => void
  onStatus: (listener: (status: TunnelStatus) => void) => () => void
  onLog: (listener: (line: string) => void) => () => void
}

export type StartTunnelOptions = {
  port: number
  bin?: string
  maxRetries?: number
  startupTimeoutMs?: number
  tunnelDomain?: string
}

export function startTunnel(options: StartTunnelOptions): TunnelHandle {
  const bin = options.bin ?? cloudflaredBinPath()
  const maxRetries = options.maxRetries ?? 5
  const timeout = options.startupTimeoutMs ?? 40_000
  const domain = options.tunnelDomain ?? process.env.BEEPER_CLOUDFLARED_DOMAIN ?? 'trycloudflare.com'

  let status: TunnelStatus = { state: 'starting' }
  let proc: ChildProcess | undefined
  let stopped = false
  let retries = 0
  const statusListeners = new Set<(s: TunnelStatus) => void>()
  const logListeners = new Set<(line: string) => void>()
  let urlResolve: ((url: string) => void) | undefined
  let urlReject: ((err: Error) => void) | undefined
  const urlPromise = new Promise<string>((resolve, reject) => { urlResolve = resolve; urlReject = reject })

  function setStatus(next: TunnelStatus): void {
    status = next
    for (const listener of statusListeners) listener(next)
    if (next.state === 'connected' && urlResolve) { urlResolve(next.url); urlResolve = undefined }
    if (next.state === 'error' && urlReject) { urlReject(new Error(next.message)); urlReject = undefined }
  }

  function spawnAttempt(): void {
    if (stopped) return
    if (retries >= maxRetries) {
      setStatus({ state: 'error', message: `cloudflared failed after ${maxRetries} retries` })
      return
    }

    let resolved = false
    let connected = false
    let foundURL: string | undefined
    const errors: string[] = []
    setStatus({ state: 'starting' })

    const timer = setTimeout(() => {
      if (resolved || stopped) return
      resolved = true
      const message = errors.length ? [...new Set(errors)].slice(-5).join('\n') : 'cloudflared startup timed out'
      setStatus({ state: 'error', message })
      proc?.kill('SIGTERM')
    }, timeout)

    const sink = new Writable({
      write(chunk, _enc, cb) {
        const text = chunk.toString()
        for (const line of text.split(/\r?\n/)) if (line) for (const l of logListeners) l(line)
        if (!resolved) {
          if (!foundURL) {
            const m = text.match(new RegExp(`https:\\/\\/[^\\s]+\\.${escapeRegex(domain)}`))
            if (m) foundURL = m[0]
          }
          if (/INF Registered tunnel connection|INF Connection/.test(text)) connected = true
          if (connected) {
            if (foundURL) {
              resolved = true
              clearTimeout(timer)
              setStatus({ state: 'connected', url: foundURL })
            } else {
              setStatus({ state: 'error', message: 'cloudflared connected but URL not found in output' })
            }
          }
          const err = findError(text)
          if (err) errors.push(err)
        }
        cb()
      },
    })

    proc = spawn(bin, ['tunnel', '--url', `http://localhost:${options.port}`, '--no-autoupdate'], { stdio: ['ignore', 'pipe', 'pipe'] })
    proc.stdout?.pipe(sink, { end: false })
    proc.stderr?.pipe(sink, { end: false })
    proc.on('exit', code => {
      clearTimeout(timer)
      if (stopped) { setStatus({ state: 'stopped' }); return }
      if (resolved && status.state === 'connected') {
        retries += 1
        setTimeout(spawnAttempt, 1000)
        return
      }
      if (!resolved) {
        setStatus({ state: 'error', message: errors.at(-1) ?? `cloudflared exited with code ${code}` })
      }
    })
    proc.on('error', err => {
      clearTimeout(timer)
      setStatus({ state: 'error', message: `failed to spawn cloudflared: ${err.message}` })
    })
  }

  spawnAttempt()

  return {
    port: options.port,
    getStatus: () => status,
    waitForURL: timeoutMs => timeoutMs ? Promise.race([urlPromise, new Promise<string>((_, reject) => setTimeout(() => reject(new Error('waitForURL timed out')), timeoutMs))]) : urlPromise,
    stop: () => {
      stopped = true
      proc?.kill('SIGTERM')
      setStatus({ state: 'stopped' })
    },
    onStatus: listener => { statusListeners.add(listener); return () => statusListeners.delete(listener) },
    onLog: listener => { logListeners.add(listener); return () => logListeners.delete(listener) },
  }
}

function findError(text: string): string | undefined {
  const patterns = [
    /failed to request quick Tunnel/,
    /failed to unmarshal quick Tunnel/,
    /failed to parse quick Tunnel ID/,
    /failed to provision routing/,
    /ERR Couldn't start tunnel/,
    /ERR Failed to serve quic connection/,
    /ERR Failed to create new quic connection error/,
  ]
  if (!patterns.some(p => p.test(text))) return undefined
  return text.replace(/^[0-9TZ:-]+ (ERR )?/g, '').replace(/connIndex.*/g, '').trim()
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
