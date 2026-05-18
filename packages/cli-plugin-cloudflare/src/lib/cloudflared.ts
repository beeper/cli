import { access, chmod, mkdir, rename, rm, writeFile } from 'node:fs/promises'
import { arch, platform } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync, spawn, type ChildProcess } from 'node:child_process'

export const currentCloudflaredVersion = '2024.8.2'
const repo = `https://github.com/cloudflare/cloudflared/releases/download/${currentCloudflaredVersion}/`

const downloads: Record<string, Record<string, string>> = {
  linux: {
    arm64: 'cloudflared-linux-arm64',
    arm: 'cloudflared-linux-arm',
    x64: 'cloudflared-linux-amd64',
    ia32: 'cloudflared-linux-386',
  },
  darwin: {
    arm64: 'cloudflared-darwin-arm64.tgz',
    x64: 'cloudflared-darwin-amd64.tgz',
  },
  win32: {
    arm64: 'cloudflared-windows-amd64.exe',
    ia32: 'cloudflared-windows-386.exe',
    x64: 'cloudflared-windows-amd64.exe',
  },
}

export type TunnelStatus =
  | { status: 'starting' }
  | { status: 'connected'; url: string }
  | { status: 'error'; message: string; tryMessage?: string }

export type StartTunnelOptions = {
  cloudflaredPath?: string
  debug?: boolean
  install?: boolean
  retries?: number
  timeoutMs?: number
  url: string
}

export type StartedTunnel = {
  done: Promise<{ code: number | null; signal: NodeJS.Signals | null }>
  process: ChildProcess
  stop: () => void
  tryMessage: string
  url: string
}

export function defaultCloudflaredPath(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..', 'bin', platform() === 'win32' ? 'cloudflared.exe' : 'cloudflared')
}

export function cloudflaredPath(explicit?: string): string {
  return explicit ?? process.env.BEEPER_CLOUDFLARED_PATH ?? defaultCloudflaredPath()
}

export async function ensureCloudflared(options: { cloudflaredPath?: string; debug?: boolean; install?: boolean } = {}): Promise<string> {
  const target = cloudflaredPath(options.cloudflaredPath)
  if (isTruthy(process.env.BEEPER_IGNORE_CLOUDFLARED)) {
    if (options.debug) process.stderr.write('Skipping cloudflared installation because BEEPER_IGNORE_CLOUDFLARED is set.\n')
    return target
  }

  if (await isUsableCloudflared(target)) return target
  if (!options.install) {
    throw new Error(`cloudflared not found at ${target}. Install it or rerun with --install.\n${whatToTry()}`)
  }

  await installCloudflared(target)
  return target
}

export async function installCloudflared(target = defaultCloudflaredPath()): Promise<void> {
  const url = downloadURL()
  await mkdir(dirname(target), { recursive: true })
  const temporary = url.endsWith('.tgz') ? `${target}.tgz` : `${target}.download`
  await downloadFile(url, temporary)

  if (url.endsWith('.tgz')) {
    execFileSync('tar', ['-xzf', basename(temporary)], { cwd: dirname(target), stdio: 'ignore' })
    await rm(temporary, { force: true })
    await rename(join(dirname(target), 'cloudflared'), target)
  } else {
    await rename(temporary, target)
  }

  if (platform() !== 'win32') await chmod(target, 0o755)
}

export async function startCloudflareTunnel(options: StartTunnelOptions): Promise<StartedTunnel> {
  const bin = await ensureCloudflared(options)
  const retries = options.retries ?? 5
  let attempt = 0
  let lastError: Error | undefined

  while (attempt <= retries) {
    try {
      const started = await runCloudflared(bin, options)
      return started
    } catch (error) {
      lastError = error as Error
      attempt += 1
      if (attempt > retries) throw error
      if (options.debug) process.stderr.write(`cloudflared crashed before connecting; retrying (${attempt}/${retries})\n`)
      await new Promise(resolve => {
        setTimeout(resolve, 1000)
      })
    }
  }

  throw new Error(`Could not start Cloudflare Tunnel: max retries reached.${lastError ? `\n${lastError.message}` : ''}\n${whatToTry()}`)
}

async function runCloudflared(bin: string, options: StartTunnelOptions): Promise<StartedTunnel> {
  const child = spawn(bin, ['tunnel', '--url', options.url, '--no-autoupdate'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const errors: string[] = []
  let connected = false
  let publicURL: string | undefined
  let resolved = false
  let stopped = false
  let exitResolve!: (value: { code: number | null; signal: NodeJS.Signals | null }) => void
  const done = new Promise<{ code: number | null; signal: NodeJS.Signals | null }>(resolve => {
    exitResolve = resolve
  })

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      child.kill('SIGTERM')
      reject(new Error(`${lastTunnelError(errors) ?? 'Could not start Cloudflare Tunnel: timed out waiting for a public URL.'}\n${whatToTry()}`))
    }, options.timeoutMs ?? 40_000)

    const cleanup = () => clearTimeout(timeout)
    const onData = (data: Buffer) => {
      const chunk = data.toString()
      if (options.debug) process.stderr.write(chunk)
      publicURL ??= findTunnelURL(chunk)
      connected ||= hasConnection(chunk)
      const error = findKnownError(chunk)
      if (error) errors.push(error)

      if (connected && publicURL) {
        resolved = true
        cleanup()
        resolve({
          done,
          process: child,
          stop() {
            stopped = true
            child.kill('SIGTERM')
          },
          tryMessage: whatToTry(),
          url: publicURL,
        })
      }
    }

    child.stdout.on('data', onData)
    child.stderr.on('data', onData)
    child.once('error', error => {
      cleanup()
      reject(error)
    })
    child.once('exit', (code, signal) => {
      exitResolve({ code, signal })
      if (resolved || stopped) return
      cleanup()
      reject(new Error(`${lastTunnelError(errors) ?? `cloudflared exited before connecting${code === null ? '' : ` with code ${code}`}.`}\n${whatToTry()}`))
    })
  })
}

async function isUsableCloudflared(path: string): Promise<boolean> {
  try {
    await access(path)
    const version = execFileSync(path, ['--version'], { encoding: 'utf8' }).split(' ')[2] ?? '0.0.0'
    return !versionIsGreaterThan(currentCloudflaredVersion, version)
  } catch {
    return false
  }
}

function downloadURL(system = platform(), cpu = arch()): string {
  const platformDownloads = downloads[system]
  if (!platformDownloads) throw new Error(`Unsupported system platform: ${system}`)
  const file = platformDownloads[cpu]
  if (!file) throw new Error(`Unsupported system architecture: ${cpu}`)
  return repo + file
}

async function downloadFile(url: string, to: string): Promise<void> {
  const response = await fetch(url, { redirect: 'follow' })
  if (!response.ok || !response.body) throw new Error(`Could not download ${url}: ${response.status} ${response.statusText}`)
  await writeFile(to, Buffer.from(await response.arrayBuffer()))
}

export function findTunnelURL(data: string, domain = cloudflaredDomain()): string | undefined {
  return data.match(new RegExp(`https:\\/\\/[^\\s]+\\.${escapeRegExp(domain)}`))?.[0]
}

function hasConnection(data: string): boolean {
  return /(INF Registered tunnel connection|INF Connection)/.test(data)
}

export function findKnownError(data: string): string | undefined {
  const knownErrors = [
    /failed to request quick Tunnel/i,
    /failed to unmarshal quick Tunnel/i,
    /failed to parse quick Tunnel ID/i,
    /failed to provision routing/i,
    /ERR Couldn't start tunnel/i,
    /ERR Failed to serve quic connection/i,
    /ERR Failed to create new quic connection error/i,
  ]
  if (!knownErrors.some(error => error.test(data))) return undefined
  return `Could not start Cloudflare Tunnel: ${cleanCloudflareLog(data)}`
}

function cleanCloudflareLog(input: string): string {
  return input.replace(/^[0-9TZ:-]+ (ERR )?/g, '').replace(/connIndex.*/g, '').trim()
}

function lastTunnelError(errors: string[]): string | undefined {
  return [...new Set(errors)].slice(-5).join('\n') || undefined
}

export function cloudflaredDomain(): string {
  return process.env.BEEPER_CLOUDFLARED_DOMAIN ?? 'trycloudflare.com'
}

export function whatToTry(): string {
  return [
    'Try running the command again.',
    'If cloudflared is already installed, set BEEPER_CLOUDFLARED_PATH or pass --cloudflared-path.',
    'If the bundled binary is missing, rerun with --install.',
    'For a stable hostname, configure a named Cloudflare Tunnel and route the Beeper target outside this quick-tunnel command.',
  ].join(' ')
}

function escapeRegExp(value: string): string {
  return value.replace(/[|\\{}()[\]^$+*?.]/g, match => `\\${match}`)
}

function isTruthy(value: string | undefined): boolean {
  return ['1', 'on', 'true', 'yes'].includes(String(value ?? '').toLowerCase())
}

export function versionIsGreaterThan(versionA: string, versionB: string): boolean {
  const [majorA = 0, minorA = 0, patchA = 0] = versionA.split('.').map(Number)
  const [majorB = 0, minorB = 0, patchB = 0] = versionB.split('.').map(Number)
  if (majorA !== majorB) return majorA > majorB
  if (minorA !== minorB) return minorA > minorB
  return patchA > patchB
}
