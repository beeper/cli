#!/usr/bin/env node
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const cliBin = path.join(repoRoot, 'bin/run.js')
const runID = process.env.BEEPER_E2E_RUN_ID || String(Date.now())
const workDir = process.env.BEEPER_E2E_WORKDIR || path.join(tmpdir(), `beeper-cli-e2e-${runID}`)
const configDir = process.env.BEEPER_E2E_CONFIG_DIR || path.join(workDir, 'cli-config')
const reportPath = process.env.BEEPER_E2E_REPORT || path.join(workDir, 'report.json')
const otp = process.env.BEEPER_E2E_OTP || '[REDACTED_OTP]'
const emailBase = Number(process.env.BEEPER_E2E_EMAIL_BASE || (900000 + Math.floor(Math.random() * 50000)))
const accountCount = Number(process.env.BEEPER_E2E_ACCOUNT_COUNT || 3)
const portStart = Number(process.env.BEEPER_E2E_PORT_START || 24_573)
const desktopCount = Number(process.env.BEEPER_E2E_DESKTOP_TARGETS || 1)
const serverCount = Number(process.env.BEEPER_E2E_SERVER_TARGETS || Math.max(1, accountCount - desktopCount))
const phases = (process.env.BEEPER_E2E_PHASES || process.argv.slice(2).join(',') || 'plan')
  .split(',')
  .map(phase => phase.trim())
  .filter(Boolean)

const report = {
  runID,
  workDir,
  configDir,
  reportPath,
  startedAt: new Date().toISOString(),
  phases,
  targets: [],
  commands: [],
  notes: [],
}

const previousReport = await readPreviousReport()
if (previousReport?.runID === runID) {
  report.targets = previousReport.targets ?? []
  report.commands = previousReport.commands ?? []
  report.notes = previousReport.notes ?? []
}

process.on('SIGINT', async () => {
  report.notes.push('Interrupted. Run the cleanup phase to stop managed server targets and remove isolated state.')
  await writeReport()
  process.exit(130)
})

await main()

async function main() {
  await mkdir(workDir, { recursive: true })
  await mkdir(configDir, { recursive: true })
  await writeReport()

  if (hasPhase('plan')) await phasePlan()
  if (hasPhase('targets')) await phaseTargets()
  if (hasPhase('install-server')) await phaseInstallServer()
  if (hasPhase('start')) await phaseStart()
  if (hasPhase('login')) await phaseLogin()
  if (hasPhase('readiness')) await phaseReadiness()
  if (hasPhase('verify')) await phaseVerify()
  if (hasPhase('messaging')) await phaseMessaging()
  if (hasPhase('cleanup')) await phaseCleanup()

  report.finishedAt = new Date().toISOString()
  await writeReport()
  console.log(`staging e2e report: ${reportPath}`)
}

async function phasePlan() {
  const targets = plannedTargets()
  report.targets = targets
  const commands = [
    'pnpm --dir packages/cli build',
    `BEEPER_E2E_PHASES=targets,start,login,readiness,verify,messaging,cleanup BEEPER_E2E_RUN_ID=${runID} node packages/cli/test/e2e-staging.mjs`,
    `BEEPER_CLI_CONFIG_DIR=${configDir} node packages/cli/bin/run.js targets list --json`,
  ]
  report.commands.push(...commands.map(command => ({ phase: 'plan', command })))
  report.notes.push('Default phase is plan only. Add explicit BEEPER_E2E_PHASES before launching targets.')
  report.notes.push('The harness uses non-default ports and an isolated BEEPER_CLI_CONFIG_DIR so the default Desktop instance is not used.')
  report.notes.push('install-server downloads Beeper Server. Use that phase only when you intend to download the staging server artifact.')
  printPlan(targets, commands)
}

async function phaseTargets() {
  for (const target of plannedTargets()) {
    const args = target.kind === 'desktop'
      ? ['targets', 'create', 'desktop', target.name, '--server-env', 'staging', '--port', String(target.port), '--json']
      : ['targets', 'create', 'server', target.name, '--server-env', 'staging', '--port', String(target.port), '--json']
    const result = runCli(args, { allowFailure: true })
    if (result.status !== 0 && !`${result.stderr}${result.stdout}`.includes('already exists')) fail(result, args)
    recordCommand('targets', args, result)
  }
  const list = runCli(['targets', 'list', '--json'])
  recordCommand('targets', ['targets', 'list', '--json'], list)
}

async function phaseInstallServer() {
  const result = runCli(['install', 'server', '--server-env', 'staging', '--json'])
  recordCommand('install-server', ['install', 'server', '--server-env', 'staging', '--json'], result)
}

async function phaseStart() {
  for (const target of plannedTargets()) {
    const args = ['targets', 'start', target.name, '--json']
    const result = runCli(args, { env: serverEnv(), allowFailure: true })
    recordCommand('start', args, result)
    if (result.status !== 0) {
      report.notes.push(`start failed for ${target.name}: ${result.stderr || result.stdout}`)
      continue
    }
    await waitForInfo(target)
  }
}

async function phaseLogin() {
  for (const target of plannedTargets()) {
    await waitForInfo(target)
    const email = target.email
    const username = usernameForEmail(email)
    const start = await appRequest(target, 'POST', '/v1/app/setup/start')
    await appRequest(target, 'POST', '/v1/app/setup/email', { setupRequestID: start.setupRequestID, email })
    const response = await appRequest(target, 'POST', '/v1/app/setup/response', { setupRequestID: start.setupRequestID, response: otp })
    const login = response.registrationRequired
      ? await appRequest(target, 'POST', '/v1/app/setup/register', {
        setupRequestID: response.setupRequestID,
        leadToken: response.leadToken,
        username,
        acceptTerms: true,
      })
      : response
    target.matrix = login.matrix
    target.accessToken = login.matrix?.accessToken
    assert(target.accessToken, `login did not return an access token for ${target.name}`)
    await saveTargetAuth(target)
    report.notes.push(`signed in ${target.name} as ${email}`)
    await writeReport()
  }
}

async function phaseReadiness() {
  for (const target of plannedTargets()) {
    const env = target.accessToken ? { BEEPER_ACCESS_TOKEN: target.accessToken } : undefined
    for (const args of [
      ['status', '--target', target.name, '--json'],
      ['doctor', '--target', target.name, '--json'],
      ['setup', '--target', target.name, '--json'],
      ['auth', 'status', '--target', target.name, '--json'],
    ]) {
      const result = runCli(args, { env, allowFailure: true })
      recordCommand('readiness', args, result)
    }
  }
}

async function phaseVerify() {
  const targets = plannedTargets().filter(target => target.accessToken)
  if (targets.length < 2) {
    report.notes.push('verify phase needs at least two signed-in targets for device-to-device auth.')
    return
  }
  for (const target of targets) {
    for (const args of [
      ['verify', 'status', '--target', target.name, '--json'],
      ['verify', 'list', '--target', target.name, '--json'],
      ['verify', 'start', '--target', target.name, '--json'],
      ['verify', 'show', '--target', target.name, '--json'],
      ['verify', 'sas', '--target', target.name, '--json'],
      ['verify', 'sas', 'confirm', '--target', target.name, '--json'],
    ]) {
      const result = runCli(args, { env: { BEEPER_ACCESS_TOKEN: target.accessToken }, allowFailure: true })
      recordCommand('verify', args, result)
    }
  }
  report.notes.push('Review verify command results. SAS/QR often needs manual matching between the two target UIs.')
}

async function phaseMessaging() {
  const [sender, receiver] = plannedTargets().filter(target => target.accessToken)
  if (!sender || !receiver?.matrix?.userID) {
    report.notes.push('messaging phase needs two signed-in targets with Matrix user IDs.')
    return
  }
  const env = { BEEPER_ACCESS_TOKEN: sender.accessToken }
  const start = runCli(['chats', 'start', receiver.matrix.userID, '--target', sender.name, '--json'], { env, allowFailure: true })
  recordCommand('messaging', ['chats', 'start', receiver.matrix.userID, '--target', sender.name, '--json'], start)
  const body = parseEnvelope(start.stdout)
  const chatID = body?.data?.chat?.id ?? body?.data?.id ?? body?.data?.chatID
  if (!chatID) {
    report.notes.push('Could not infer chat ID from chats start; run send/list commands manually with the chat ID from the target UI.')
    return
  }
  for (const args of [
    ['send', 'text', '--to', chatID, '--message', `staging e2e ${runID}`, '--target', sender.name, '--json'],
    ['messages', 'list', '--chat', chatID, '--target', sender.name, '--limit', '10', '--json'],
    ['chats', 'show', '--chat', chatID, '--target', sender.name, '--json'],
  ]) {
    const result = runCli(args, { env, allowFailure: true })
    recordCommand('messaging', args, result)
  }
}

async function phaseCleanup() {
  for (const target of plannedTargets()) {
    if (target.kind === 'server') {
      const stop = runCli(['targets', 'stop', target.name, '--json'], { allowFailure: true })
      recordCommand('cleanup', ['targets', 'stop', target.name, '--json'], stop)
    } else {
      report.notes.push(`Desktop target ${target.name} may need manual quit if it was launched through the app.`)
    }
  }
  if (process.env.BEEPER_E2E_REMOVE_STATE === '1') await rm(workDir, { recursive: true, force: true })
}

function plannedTargets() {
  if (report.targets?.length) return report.targets
  const targets = []
  for (let i = 0; i < desktopCount; i++) {
    targets.push(targetPlan('desktop', i, targets.length))
  }
  for (let i = 0; i < serverCount; i++) {
    targets.push(targetPlan('server', i, targets.length))
  }
  return targets.slice(0, accountCount)
}

function targetPlan(kind, index, ordinal) {
  const email = process.env[`BEEPER_E2E_EMAIL_${ordinal + 1}`] || `staging-user+${emailBase + ordinal}@beeper.com`
  return {
    kind,
    index,
    ordinal,
    name: process.env[`BEEPER_E2E_TARGET_${ordinal + 1}`] || `${kind}-${runID}-${index + 1}`,
    email,
    port: Number(process.env[`BEEPER_E2E_PORT_${ordinal + 1}`] || (portStart + ordinal)),
    baseURL: `http://127.0.0.1:${Number(process.env[`BEEPER_E2E_PORT_${ordinal + 1}`] || (portStart + ordinal))}`,
  }
}

async function readPreviousReport() {
  try {
    return JSON.parse(await readFile(reportPath, 'utf8'))
  } catch {
    return undefined
  }
}

function runCli(args, options = {}) {
  const result = spawnSync(process.execPath, [cliBin, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      ...options.env,
      BEEPER_CLI_CONFIG_DIR: configDir,
    },
  })
  if (!options.allowFailure && result.status !== 0) fail(result, args)
  return result
}

function fail(result, args) {
  throw new Error(`beeper ${args.join(' ')} failed\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`)
}

function recordCommand(phase, args, result) {
  report.commands.push({
    phase,
    command: `beeper ${args.join(' ')}`,
    status: result.status,
    stdout: result.stdout.slice(0, 4000),
    stderr: result.stderr.slice(0, 4000),
  })
}

async function waitForInfo(target) {
  const deadline = Date.now() + 180_000
  while (Date.now() < deadline) {
    try {
      const response = await fetch(new URL('/v1/info', target.baseURL), { signal: AbortSignal.timeout(1000) })
      if (response.ok) return response.json()
    } catch {
      // keep waiting
    }
    await sleep(1000)
  }
  throw new Error(`Timed out waiting for ${target.name} on ${target.baseURL}`)
}

async function appRequest(target, method, endpoint, body) {
  const response = await fetch(new URL(endpoint, target.baseURL), {
    method,
    headers: body ? { 'content-type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) throw new Error(`${method} ${target.name} ${endpoint} failed: ${response.status} ${await response.text()}`)
  if (response.status === 204) return {}
  const text = await response.text()
  return text ? JSON.parse(text) : {}
}

async function saveTargetAuth(target) {
  const targetPath = path.join(configDir, 'targets', `${target.name}.json`)
  const current = JSON.parse(await readFile(targetPath, 'utf8'))
  current.auth = {
    accessToken: target.accessToken,
    tokenType: 'Bearer',
  }
  await writeFile(targetPath, `${JSON.stringify(current, null, 2)}\n`, { mode: 0o600 })
}

function parseEnvelope(stdout) {
  try {
    return JSON.parse(stdout)
  } catch {
    return undefined
  }
}

function serverEnv() {
  const env = {}
  if (process.env.BEEPER_SERVER_BIN) env.BEEPER_SERVER_BIN = process.env.BEEPER_SERVER_BIN
  return env
}

function usernameForEmail(email) {
  const digits = email.match(/\+(\d+)@/)?.[1] ?? runID.replace(/\D/g, '').slice(-8)
  return `staging-user${digits}`
}

function hasPhase(name) {
  return phases.includes(name) || phases.includes('all')
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function writeReport() {
  await mkdir(path.dirname(reportPath), { recursive: true })
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`)
}

function printPlan(targets, commands) {
  console.log(`Run ID: ${runID}`)
  console.log(`Workdir: ${workDir}`)
  console.log(`Config: ${configDir}`)
  console.log('Targets:')
  for (const target of targets) console.log(`- ${target.name}: ${target.kind} ${target.baseURL} ${target.email}`)
  console.log('Next commands:')
  for (const command of commands) console.log(`- ${command}`)
}
