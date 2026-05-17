import { spawn } from 'node:child_process'
import { createWriteStream } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { beeperDir, type Target } from './targets.js'
import { readInstallations } from './installations.js'

export type ProfileRun = {
  id: string
  pid: number
  startedAt: string
  log: string
  errorLog: string
}

export const profileRunDir = () => join(beeperDir(), 'run', 'profiles')
export const profileLogDir = () => join(beeperDir(), 'logs', 'profiles')
export const profileRunPath = (id: string) => join(profileRunDir(), `${id}.json`)
export const profileLogPath = (id: string) => join(profileLogDir(), `${id}.log`)
export const profileErrorLogPath = (id: string) => join(profileLogDir(), `${id}.err.log`)

export function assertProfile(target: Target): void {
  if (!target.managed || !target.dataDir) throw new Error(`Target "${target.id}" is not a local profile.`)
}

export async function startProfile(target: Target): Promise<ProfileRun | { id: string; startedAt: string }> {
  assertProfile(target)
  if (target.type === 'desktop') return startDesktopProfile(target)
  return startServerProfile(target)
}

export async function stopProfile(target: Target): Promise<void> {
  assertProfile(target)
  if (target.type === 'desktop') throw new Error('Desktop profiles are started by the Beeper app. Quit the profile from the app.')
  const run = await readRun(target.id)
  if (!run) throw new Error(`Profile "${target.id}" is not running.`)
  try {
    process.kill(run.pid, 'SIGTERM')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error
  }
  await rm(profileRunPath(target.id), { force: true })
}

export async function profileStatus(target: Target): Promise<Record<string, unknown>> {
  assertProfile(target)
  const run = await readRun(target.id)
  const reachable = await fetch(new URL('/v1/info', target.baseURL), { signal: AbortSignal.timeout(1000) })
    .then(response => response.ok)
    .catch(() => false)
  return {
    id: target.id,
    type: target.type,
    url: target.baseURL,
    running: reachable || !!run && isRunning(run.pid),
    pid: run?.pid,
    startedAt: run?.startedAt,
    log: run?.log,
    errorLog: run?.errorLog,
  }
}

export async function enableProfile(target: Target): Promise<string> {
  assertProfile(target)
  if (target.type !== 'server') throw new Error('Only server profiles can be enabled at login.')
  if (process.platform === 'darwin') return writeLaunchAgent(target)
  if (process.platform === 'linux') return writeSystemdUnit(target)
  throw new Error('Beeper Server is not available on Windows.')
}

export async function disableProfile(target: Target): Promise<string> {
  assertProfile(target)
  if (target.type !== 'server') throw new Error('Only server profiles can be disabled at login.')
  if (process.platform === 'darwin') {
    const path = join(process.env.HOME ?? beeperDir(), 'Library', 'LaunchAgents', launchAgentName(target))
    await rm(path, { force: true })
    return path
  }
  if (process.platform === 'linux') {
    const path = join(process.env.HOME ?? beeperDir(), '.config', 'systemd', 'user', systemdUnitName(target))
    await rm(path, { force: true })
    return path
  }
  throw new Error('Beeper Server is not available on Windows.')
}

export async function readRun(id: string): Promise<ProfileRun | undefined> {
  try {
    return JSON.parse(await readFile(profileRunPath(id), 'utf8')) as ProfileRun
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw error
  }
}

async function startDesktopProfile(target: Target): Promise<{ id: string; startedAt: string }> {
  const installations = await readInstallations().catch(() => ({ desktop: undefined }))
  const args = installations.desktop?.path ? ['-n', installations.desktop.path, '--args'] : ['-n', '-a', 'Beeper', '--args']
  if (target.port) args.push(`--pas-port=${target.port}`)
  if (target.serverEnv) args.push(`--server-env=${target.serverEnv}`)
  spawn('open', args, {
    detached: true,
    stdio: 'ignore',
    env: {
      ...process.env,
      ALLOW_MULTIPLE_INSTANCES: 'true',
      BEEPER_PROFILE: target.profile ?? target.id,
      BEEPER_USER_DATA_DIR: target.dataDir!,
    },
  }).unref()
  return { id: target.id, startedAt: new Date().toISOString() }
}

async function startServerProfile(target: Target): Promise<ProfileRun> {
  const installations = await readInstallations()
  const binary = process.env.BEEPER_SERVER_BIN || installations.server?.path
  if (!binary) throw new Error('Beeper Server is not installed. Run: beeper install server')
  await mkdir(profileRunDir(), { recursive: true })
  await mkdir(profileLogDir(), { recursive: true })
  const log = profileLogPath(target.id)
  const errorLog = profileErrorLogPath(target.id)
  const child = spawn(binary, serverArgs(target), {
    detached: true,
    stdio: ['ignore', createWriteStream(log, { flags: 'a' }), createWriteStream(errorLog, { flags: 'a' })],
    env: { ...process.env, BEEPER_SERVER_DATA_DIR: target.dataDir! },
  })
  child.unref()
  const run = { id: target.id, pid: child.pid!, startedAt: new Date().toISOString(), log, errorLog }
  await writeFile(profileRunPath(target.id), `${JSON.stringify(run, null, 2)}\n`, { mode: 0o600 })
  return run
}

function serverArgs(target: Target): string[] {
  const args = [
    '--host=127.0.0.1',
    `--port=${target.port ?? new URL(target.baseURL).port}`,
    `--data-dir=${target.dataDir}`,
  ]
  if (target.serverEnv) args.push(`--server-env=${target.serverEnv}`)
  return args
}

function isRunning(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

async function writeLaunchAgent(target: Target): Promise<string> {
  const installations = await readInstallations()
  const binary = process.env.BEEPER_SERVER_BIN || installations.server?.path
  if (!binary) throw new Error('Beeper Server is not installed. Run: beeper install server')
  const dir = join(process.env.HOME ?? beeperDir(), 'Library', 'LaunchAgents')
  await mkdir(dir, { recursive: true })
  const path = join(dir, launchAgentName(target))
  await writeFile(path, launchAgentPlist(target, binary), 'utf8')
  return path
}

async function writeSystemdUnit(target: Target): Promise<string> {
  const installations = await readInstallations()
  const binary = process.env.BEEPER_SERVER_BIN || installations.server?.path
  if (!binary) throw new Error('Beeper Server is not installed. Run: beeper install server')
  const dir = join(process.env.HOME ?? beeperDir(), '.config', 'systemd', 'user')
  await mkdir(dir, { recursive: true })
  const path = join(dir, systemdUnitName(target))
  await writeFile(path, systemdUnit(target, binary), 'utf8')
  return path
}

function launchAgentName(target: Target): string {
  return `com.beeper.cli.profile.${target.id}.plist`
}

function systemdUnitName(target: Target): string {
  return `beeper-profile-${target.id}.service`
}

function launchAgentPlist(target: Target, binary: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>com.beeper.cli.profile.${target.id}</string>
<key>ProgramArguments</key><array>${[binary, ...serverArgs(target)].map(arg => `<string>${escapeXML(arg)}</string>`).join('')}</array>
<key>RunAtLoad</key><true/>
<key>KeepAlive</key><true/>
<key>StandardOutPath</key><string>${escapeXML(profileLogPath(target.id))}</string>
<key>StandardErrorPath</key><string>${escapeXML(profileErrorLogPath(target.id))}</string>
</dict></plist>
`
}

function systemdUnit(target: Target, binary: string): string {
  return `[Unit]
Description=Beeper profile ${target.id}

[Service]
ExecStart=${[binary, ...serverArgs(target)].map(systemdQuote).join(' ')}
Restart=always
Environment=BEEPER_SERVER_DATA_DIR=${systemdQuote(target.dataDir!)}
StandardOutput=append:${profileLogPath(target.id)}
StandardError=append:${profileErrorLogPath(target.id)}

[Install]
WantedBy=default.target
`
}

function escapeXML(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function systemdQuote(value: string): string {
  return value.includes(' ') ? `"${value.replaceAll('"', '\\"')}"` : value
}

