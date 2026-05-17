import { createWriteStream } from 'node:fs'
import { access, chmod, mkdir, rename, rm } from 'node:fs/promises'
import { arch, platform } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'
import { execFileSync, spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'

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
  process: ChildProcessWithoutNullStreams
  stop: () => void
  url: string
}

export function defaultCloudflaredPath(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..', 'bin', platform() === 'win32' ? 'cloudflared.exe' : 'cloudflared')
}

export function cloudflaredPath(explicit?: string): string {
  return explicit ?? process.env.BEEPER_CLOUDFLARED_PATH ?? defaultCloudflaredPath()
}

export async function ensureCloudflared(options: { cloudflaredPath?: string; install?: boolean } = {}): Promise<string> {
  const target = cloudflaredPath(options.cloudflaredPath)
  if (await isUsableCloudflared(target)) return target
  if (!options.install) {
    throw new Error(`cloudflared not found at ${target}. Install it or rerun with --install.`)
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

  while (true) {
    try {
      return await runCloudflared(bin, options)
    } catch (error) {
      attempt += 1
      if (attempt > retries) throw error
      if (options.debug) process.stderr.write(`cloudflared crashed before connecting; retrying (${attempt}/${retries})\n`)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
}

async function runCloudflared(bin: string, options: StartTunnelOptions): Promise<StartedTunnel> {
  const child = spawn(bin, ['tunnel', '--url', options.url, '--no-autoupdate'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const errors: string[] = []
  let connected = false
  let publicURL: string | undefined

  return await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      child.kill('SIGTERM')
      reject(new Error(lastTunnelError(errors) ?? 'Could not start Cloudflare Tunnel: timed out waiting for a public URL.'))
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
        cleanup()
        resolve({
          process: child,
          stop: () => child.kill('SIGTERM'),
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
    child.once('exit', code => {
      if (publicURL) return
      cleanup()
      reject(new Error(lastTunnelError(errors) ?? `cloudflared exited before connecting${code === null ? '' : ` with code ${code}`}.`))
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
  await pipeline(response.body, createWriteStream(to))
}

function findTunnelURL(data: string): string | undefined {
  return data.match(/https:\/\/[^\s]+\.trycloudflare\.com/)?.[0]
}

function hasConnection(data: string): boolean {
  return /(INF Registered tunnel connection|INF Connection)/.test(data)
}

function findKnownError(data: string): string | undefined {
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

export function versionIsGreaterThan(versionA: string, versionB: string): boolean {
  const [majorA = 0, minorA = 0, patchA = 0] = versionA.split('.').map(Number)
  const [majorB = 0, minorB = 0, patchB = 0] = versionB.split('.').map(Number)
  if (majorA !== majorB) return majorA > majorB
  if (minorA !== minorB) return minorA > minorB
  return patchA > patchB
}
