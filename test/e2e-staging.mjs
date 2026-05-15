#!/usr/bin/env node
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createWriteStream } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const cliBin = path.join(repoRoot, 'bin/run.js')
const defaultDesktopRoot = '/Users/batuhan/.codex/worktrees/43bc/beeper/desktop'
const desktopRoot = process.env.BEEPER_DESKTOP_ROOT || defaultDesktopRoot
const accountCount = Number(process.env.BEEPER_E2E_ACCOUNT_COUNT || 4)
const otp = process.env.BEEPER_E2E_OTP || '959729'
const runID = process.env.BEEPER_E2E_RUN_ID || String(Date.now())
const startDesktop = process.env.BEEPER_E2E_START_DESKTOP !== '0'
const keepDesktop = process.env.BEEPER_E2E_KEEP_DESKTOP === '1'
const workDir = process.env.BEEPER_E2E_WORKDIR || path.join(tmpdir(), `beeper-cli-e2e-${runID}`)
const reportPath = process.env.BEEPER_E2E_REPORT || path.join(workDir, 'report.json')
const portStart = Number(process.env.BEEPER_E2E_PORT_START || 23373)
const portEnd = Number(process.env.BEEPER_E2E_PORT_END || 23423)
const emailBase = Number(process.env.BEEPER_E2E_EMAIL_BASE || (900000 + Math.floor(Math.random() * 50000)))
const bridgeAccount = process.env.BEEPER_E2E_BRIDGE_ACCOUNT

const children = []
const report = {
  runID,
  startedAt: new Date().toISOString(),
  desktopRoot,
  workDir,
  commands: [],
  endpoints: [],
  instances: [],
  artifacts: {},
}

const coveredCommands = new Set()
let cleanedUp = false

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

async function main() {
  await mkdir(workDir, { recursive: true })
  const manifest = await loadCommandManifest()
  report.manifestCommandCount = manifest.length
  report.manifestCommands = manifest.map(item => item.command)

  const profiles = Array.from({ length: accountCount }, (_, index) => ({
    index,
    profile: process.env[`BEEPER_E2E_PROFILE_${index + 1}`] || `cli-e2e-${runID}-${index + 1}`,
    email: process.env[`BEEPER_E2E_EMAIL_${index + 1}`] || `qatest+${emailBase + index}@beeper.com`,
  }))

  const beforePorts = await scanDesktopServers()
  const usedPorts = new Set(beforePorts.map(server => portFromBaseURL(server.baseURL)))
  for (const profile of profiles) {
    profile.desiredPort = nextAvailablePort(usedPorts)
    profile.expectedBaseURL = `http://127.0.0.1:${profile.desiredPort}`
  }
  if (startDesktop) {
    const [firstProfile, ...remainingProfiles] = profiles
    if (firstProfile) {
      await startDesktopProfile(firstProfile, firstProfile.index)
      await waitForDesktopProfile(firstProfile)
    }
    for (const profile of remainingProfiles) await startDesktopProfile(profile, profile.index)
  }

  for (const profile of profiles) {
    const baseURL = await waitForDesktopProfile(profile)
    const configDir = path.join(workDir, 'cli-config', profile.profile)
    await mkdir(configDir, { recursive: true })
    const instance = { ...profile, baseURL, configDir }
    report.instances.push(instance)
    await loginInstance(instance)
    await waitForAppUsable(instance)
  }

  const primary = report.instances[0]
  assert(primary, 'expected at least one instance')

  await runLocalCommands(primary)
  const fixture = await createFixtureFile()
  const context = await buildMessagingContext(primary)
  await runAuthenticatedReadCommands(primary, context)
  await runMessagingCommands(primary, context, fixture)
  await runAccountLoginCoverage(primary)
  await runWatchAndRpcCommands(primary, context)
  await runE2EECommands(primary)
  await runRawEndpointCommands(primary, context, fixture)
  await runCrossInstanceMessaging(context)
  await runCleanupCommands(primary)

  const missing = manifest.map(item => item.command).filter(command => !coveredCommands.has(command))
  report.missingCommands = missing
  if (report.missingOpenAPIOperations?.length) {
    throw new Error(`E2E did not cover ${report.missingOpenAPIOperations.length} OpenAPI operation(s): ${report.missingOpenAPIOperations.join(', ')}`)
  }
  report.finishedAt = new Date().toISOString()
  await writeReport()

  if (missing.length) {
    throw new Error(`E2E did not exercise ${missing.length} command(s): ${missing.join(', ')}`)
  }
}

async function loadCommandManifest() {
  const result = await runCli(['commands', '--json'], { allowFailure: false, record: false })
  const parsed = JSON.parse(result.stdout)
  assert(Array.isArray(parsed), 'commands --json did not return an array')
  coveredCommands.add('commands')
  report.commands.push({ command: 'commands', ok: true, phase: 'manifest' })
  return parsed
}

async function startDesktopProfile(profile, index) {
  const logPath = path.join(workDir, `${profile.profile}.desktop.log`)
  const log = createWriteStream(logPath, { flags: 'a' })
  const launch = index === 0 ? devServerLaunch(profile) : electronLaunch(profile)
  const child = spawn(launch.command, launch.args, {
    cwd: desktopRoot,
    env: {
      ...process.env,
      BEEPER_PROFILE: profile.profile,
      BEEPER_SMOKE_TEST: 'true',
      PAS_PORT: String(profile.desiredPort),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  child.stdout.pipe(log)
  child.stderr.pipe(log)
  children.push({ child, profile: profile.profile, log, logPath })
  report.artifacts[`${profile.profile}.desktopLog`] = logPath
  await sleep(1500)
  if (child.exitCode !== null) throw new Error(`Desktop profile ${profile.profile} exited early. See ${logPath}`)
}

function devServerLaunch(profile) {
  return { command: 'yarn', args: ['dev:staging', `--pas-port=${profile.desiredPort}`] }
}

function electronLaunch(profile) {
  const args = ['.', '--server-env=staging', `--pas-port=${profile.desiredPort}`]
  if (process.env.BEEPER_E2E_ELECTRON_BIN) {
    return { command: process.env.BEEPER_E2E_ELECTRON_BIN, args }
  }
  if (process.platform === 'darwin') {
    return {
      command: path.join(desktopRoot, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron'),
      args,
    }
  }
  if (process.platform === 'win32') {
    return {
      command: path.join(desktopRoot, 'node_modules/electron/dist/electron.exe'),
      args,
    }
  }
  return {
    command: path.join(desktopRoot, 'node_modules/electron/dist/electron'),
    args,
  }
}

async function waitForDesktopProfile(profile) {
  const deadline = Date.now() + 180_000
  while (Date.now() < deadline) {
    try {
      const response = await fetchWithTimeout(new URL('/v1/info', profile.expectedBaseURL), {}, 1000)
      if (response.ok) {
        const appStatus = await fetchWithTimeout(new URL('/v1/app/status', profile.expectedBaseURL), {}, 1000)
        if (appStatus.status !== 404) return profile.expectedBaseURL
      }
    } catch {
      // Keep waiting for this exact profile port.
    }
    await sleep(1000)
  }
  throw new Error(`Timed out waiting for Desktop profile ${profile.profile} to expose /v1/info on ${profile.expectedBaseURL}`)
}

function portFromBaseURL(baseURL) {
  return Number(new URL(baseURL).port)
}

function nextAvailablePort(usedPorts) {
  for (let port = portStart; port <= portEnd; port++) {
    if (!usedPorts.has(port)) {
      usedPorts.add(port)
      return port
    }
  }
  throw new Error(`No free candidate PAS ports in ${portStart}..${portEnd}`)
}

async function scanDesktopServers() {
  const servers = []
  await Promise.all(Array.from({ length: portEnd - portStart + 1 }, async (_, offset) => {
    const port = portStart + offset
    const baseURL = `http://127.0.0.1:${port}`
    try {
      const response = await fetchWithTimeout(new URL('/v1/info', baseURL), {}, 500)
      if (!response.ok) return
      const info = await response.json()
      if (!info?.server?.mcp_enabled) return
      let supportsAppStatus = false
      try {
        const appStatus = await fetchWithTimeout(new URL('/v1/app/status', baseURL), {}, 500)
        supportsAppStatus = appStatus.status !== 404
      } catch {
        supportsAppStatus = false
      }
      servers.push({ baseURL, info, supportsAppStatus })
    } catch {
      // Port is not a Beeper Desktop API server.
    }
  }))
  return servers.sort((a, b) => a.baseURL.localeCompare(b.baseURL))
}

async function fetchWithTimeout(url, init = {}, timeoutMs = 10_000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

async function loginInstance(instance) {
  const status = await getUnauthedAppStatus(instance.baseURL)
  if (status?.state === 'needs-login') {
    const username = instance.email.match(/\+(\d+)@/)?.[1] ? `qatest${RegExp.$1}` : `qatest${runID}${instance.index}`
    const result = await runCli([
      'auth', 'login',
      '--app-login',
      '--server-url', instance.baseURL,
      '--email', instance.email,
      '--code', otp,
      '--username', username,
      '--accept-terms',
      '--json',
    ], { instance })
    const body = parseJSON(result.stdout, 'auth login --app-login')
    instance.userID = body.matrix?.userID
    instance.accessToken = body.desktopAPI?.accessToken
    assert(instance.accessToken, `login did not return a Desktop API token for ${instance.profile}`)
    coveredCommands.add('auth login')
    coveredCommands.add('login')
    return
  }

  const configPath = path.join(instance.configDir, 'config.json')
  try {
    const config = JSON.parse(await readFile(configPath, 'utf8'))
    if (config.auth?.accessToken) {
      instance.accessToken = config.auth.accessToken
      return
    }
  } catch {
    // No reusable CLI token.
  }

  throw new Error([
    `${instance.profile} is already signed in but this E2E run has no reusable Desktop API token.`,
    'Use a fresh BEEPER_PROFILE, preserve the E2E workdir, or approve OAuth manually with BEEPER_E2E_START_DESKTOP=0.',
  ].join(' '))
}

async function getUnauthedAppStatus(baseURL) {
  const response = await fetchWithTimeout(new URL('/v1/app/status', baseURL), {}, 10_000)
  if (response.status === 401 || response.status === 403) return { state: 'signed-in-auth-required' }
  if (!response.ok) throw new Error(`GET /v1/app/status failed for ${baseURL}: ${response.status} ${await response.text()}`)
  return response.json()
}

async function waitForAppUsable(instance) {
  let lastObservation = 'no app status response'
  for (let attempt = 0; attempt < 300; attempt++) {
    try {
      const result = await runCli(['app', 'status', '--json'], { instance, allowFailure: true })
      lastObservation = `app status exited ${result.code}: ${result.stderr || result.stdout}`.slice(0, 1000)
      if (result.code === 0) {
        const status = parseJSON(result.stdout, 'app status')
        instance.appState = status.state
        if (status.matrix?.userID) instance.userID = status.matrix.userID
        lastObservation = `state=${status.state} user=${instance.userID ?? 'unknown'}`
        if (status.state !== 'initializing' && status.state !== 'needs-first-sync') return
      }
    } catch {
      lastObservation = 'app status did not return parseable JSON'
    }
    await sleep(1000)
  }
  throw new Error(`Desktop API never became usable for ${instance.profile}; last observation: ${lastObservation}`)
}

async function runLocalCommands(instance) {
  await runCli(['auth', 'status', '--json'], { instance })
  await runCli(['config', 'path'], { instance })
  await runCli(['config', 'get', '--json'], { instance })
  await runCli(['config', 'get', 'baseURL', '--json'], { instance })
  await runCli(['config', 'set', 'baseURL', instance.baseURL], { instance })
  await runCli(['llm'], { instance })
  coveredCommands.add('auth status')
  coveredCommands.add('config path')
  coveredCommands.add('config get')
  coveredCommands.add('config set')
  coveredCommands.add('llm')
}

async function buildMessagingContext(instance) {
  const accounts = parseJSON((await runCli(['accounts', '--json'], { instance })).stdout, 'accounts')
  coveredCommands.add('accounts')
  const account = firstItem(accounts)
  assert(account, 'accounts returned no usable accounts')
  const accountID = String(account.accountID ?? account.id)
  const bridgeID = String(account.bridgeID ?? account.bridge?.id ?? account.protocolID ?? account.network ?? accountID)

  const chats = parseJSON((await runCli(['chats', '--json', '--limit', '20'], { instance })).stdout, 'chats')
  coveredCommands.add('chats')
  coveredCommands.add('threads')

  let chat = firstWritableChat(firstArray(chats))
  if (!chat && report.instances[1]?.userID) {
    const start = await retryJSONCommand(() => runCli([
      'start-chat',
      '--id', report.instances[1].userID,
      '--message', `cli e2e hello ${runID}`,
      '--allow-invite',
      '--json',
    ], { instance }), 'start-chat', 12, 5000)
    coveredCommands.add('start-chat')
    chat = start.chat ?? start
  }
  if (!chat && instance.userID) {
    const start = await retryJSONCommand(() => runCli([
      'start-chat',
      '--id', instance.userID,
      '--message', `cli e2e self hello ${runID}`,
      '--allow-invite',
      '--json',
    ], { instance }), 'start-chat self', 6, 5000)
    coveredCommands.add('start-chat')
    chat = start.chat ?? start
  }
  if (!chat) throw new Error('Could not find or create a chat for message command coverage')

  const chatID = String(chat.id ?? chat.chatID)
  const messages = parseJSON((await runCli(['messages', chatID, '--json', '--limit', '20'], { instance })).stdout, 'messages')
  coveredCommands.add('messages')
  const message = firstArray(messages)[0]
  return {
    accountID,
    bridgeID,
    chatID,
    chat,
    messageID: message?.id,
    matrixEventID: message?.eventID ?? message?.eventId ?? message?.matrixEventID ?? message?.id,
  }
}

async function retryJSONCommand(fn, label, attempts, intervalMs) {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return parseJSON((await fn()).stdout, label)
    } catch (error) {
      lastError = error
      if (attempt < attempts) await sleep(intervalMs)
    }
  }
  throw lastError
}

async function runAuthenticatedReadCommands(instance, context) {
  await runCli(['status', '--json'], { instance })
  await runCli(['doctor', '--json'], { instance })
  await runCli(['app', 'status', '--json'], { instance })
  await runCli(['current-user', '--json'], { instance })
  await runCli(['whoami', '--json'], { instance })
  await runCli(['api', 'get', '/v1/info', '--json'], { instance })
  await runCli(['api', 'post', '/v1/search', '--body', JSON.stringify({ query: 'cli' }), '--json'], { instance, allowFailure: true })
  await runCli(['chats', 'search', 'cli', '--json', '--limit', '5'], { instance, allowFailure: true })
  await runCli(['search', 'cli', '--json'], { instance, allowFailure: true })
  await runCli(['chat', context.chatID, '--json'], { instance })
  await runCli(['thread', context.chatID, '--json'], { instance })
  await runCli(['messages', 'search', 'cli', '--json', '--limit', '5'], { instance, allowFailure: true })
  await runCli(['contacts', 'list', context.accountID, '--json'], { instance, allowFailure: true })
  await runCli(['contacts', 'search', 'qatest', '--account', context.accountID, '--json'], { instance, allowFailure: true })

  for (const command of [
    'status', 'doctor', 'app status', 'current-user', 'whoami', 'api get', 'api post',
    'chats search', 'search', 'chat', 'thread', 'messages search', 'contacts list', 'contacts search',
  ]) coveredCommands.add(command)
}

async function runMessagingCommands(instance, context, fixture) {
  const send = parseJSON((await runCli(['send', context.chatID, `cli e2e send ${runID}`, '--json'], { instance })).stdout, 'send')
  coveredCommands.add('send')
  context.pendingMessageID = send.pendingMessageID
  if (!context.messageID) context.messageID = send.messageID ?? send.id ?? send.pendingMessageID

  await runCli(['send-file', context.chatID, fixture, `file ${runID}`, '--json'], { instance, allowFailure: true })
  coveredCommands.add('send-file')
  await runCli(['draft', context.chatID, `draft ${runID}`, '--json'], { instance })
  await runCli(['clear-draft', context.chatID, '--json'], { instance })
  await runCli(['read', context.chatID, '--json'], { instance })
  await runCli(['unread', context.chatID, '--json'], { instance })
  await runCli(['mark-read', context.chatID, '--json'], { instance })
  await runCli(['mark-unread', context.chatID, '--json'], { instance })
  await runCli(['mute', context.chatID, '--json'], { instance })
  await runCli(['unmute', context.chatID, '--json'], { instance })
  await runCli(['pin', context.chatID, '--json'], { instance })
  await runCli(['unpin', context.chatID, '--json'], { instance })
  await runCli(['archive', context.chatID], { instance })
  await runCli(['unarchive', context.chatID], { instance })
  await runCli(['low-priority', context.chatID, '--json'], { instance })
  await runCli(['inbox', context.chatID, '--json'], { instance })
  await runCli(['message-expiry', context.chatID, 'off', '--json'], { instance, allowFailure: true })
  await runCli(['title', context.chatID, `CLI E2E ${runID}`, '--json'], { instance, allowFailure: true })
  await runCli(['description', context.chatID, `CLI E2E description ${runID}`, '--json'], { instance, allowFailure: true })
  await runCli(['avatar', context.chatID, '--clear', '--json'], { instance, allowFailure: true })
  await runCli(['notify-anyway', context.chatID, '--json'], { instance, allowFailure: true })
  await runCli(['focus', '--base-url', instance.baseURL], { instance, allowFailure: true })
  await runCli(['chat', 'open', context.chatID, '--base-url', instance.baseURL], { instance, allowFailure: true })

  const reminderWhen = new Date(Date.now() + 60 * 60 * 1000).toISOString()
  await runCli(['remind', context.chatID, reminderWhen], { instance, allowFailure: true })
  await runCli(['unremind', context.chatID], { instance, allowFailure: true })

  if (context.messageID) {
    await runCli(['message', context.chatID, context.messageID, '--json'], { instance, allowFailure: true })
    await runCli(['reply', context.chatID, context.messageID, `reply ${runID}`, '--json'], { instance, allowFailure: true })
    await runCli(['reply-file', context.chatID, context.messageID, fixture, `reply file ${runID}`, '--json'], { instance, allowFailure: true })
    await runCli(['react', context.chatID, context.messageID, '👍', '--json'], { instance, allowFailure: true })
    await runCli(['unreact', context.chatID, context.messageID, '👍', '--json'], { instance, allowFailure: true })
    await runCli(['edit', context.chatID, context.messageID, `edited ${runID}`, '--json'], { instance, allowFailure: true })
    await runCli(['delete-message', context.chatID, context.messageID], { instance, allowFailure: true })
  }

  await runCli(['assets', 'upload', fixture, '--json'], { instance, allowFailure: true })
  await runCli(['assets', 'download', `file://${fixture}`, '--json'], { instance, allowFailure: true })
  await runCli(['export', '--limit-chats', '1', '--limit-messages', '3', '--no-attachments', '--quiet', '--out', path.join(workDir, 'export')], { instance })

  for (const command of [
    'send-file', 'draft', 'clear-draft', 'read', 'unread', 'mark-read', 'mark-unread',
    'mute', 'unmute', 'pin', 'unpin', 'archive', 'unarchive', 'low-priority', 'inbox',
    'message-expiry', 'title', 'description', 'avatar', 'notify-anyway', 'focus', 'chat open', 'remind',
    'unremind', 'message', 'reply', 'reply-file', 'react', 'unreact', 'edit',
    'delete-message', 'assets upload', 'assets download', 'export',
  ]) coveredCommands.add(command)

  await runCli(['create-chat', '--account', context.accountID, '--participant', instance.userID ?? 'missing-user-id', '--json'], { instance, allowFailure: true })
  coveredCommands.add('create-chat')

  if (!report.instances[1]?.userID) {
    await runCli(['start-chat', '--id', instance.userID ?? 'missing-user-id', '--json'], { instance, allowFailure: true })
    coveredCommands.add('start-chat')
  }
}

async function runRawEndpointCommands(instance, context, fixture) {
  const spec = await fetchJSON(new URL('/v1/spec', instance.baseURL), authHeaders(instance))
  report.openapiPathCount = Object.keys(spec.paths ?? {}).length
  report.openapiPaths = Object.entries(spec.paths ?? {}).flatMap(([routePath, methods]) =>
    Object.keys(methods).map(method => `${method.toUpperCase()} ${routePath}`))
  report.endpointCoverage = []

  const operationKeys = new Set(report.openapiPaths)
  const coveredOperations = new Set()
  const recordCoverage = (method, specPath, evidence) => {
    const operation = `${method.toUpperCase()} ${specPath}`
    coveredOperations.add(operation)
    report.endpointCoverage.push({ operation, ...evidence })
  }

  for (const [method, specPath, command] of commandEndpointCoverage()) {
    recordCoverage(method, specPath, { via: 'cli', command })
  }

  const uploadedAsset = await uploadBase64AssetForCoverage(instance, recordCoverage)
  const matrixRoomForLeave = await createMatrixRoomForCoverage(instance, recordCoverage)

  const rawChecks = [
    ['GET', '/v1/info', '/v1/info'],
    ['GET', '/oauth/userinfo', '/oauth/userinfo'],
    ['POST', '/oauth/introspect', '/oauth/introspect', new URLSearchParams({ token: instance.accessToken, token_type_hint: 'access_token' })],
    ['POST', '/oauth/revoke', '/oauth/revoke', new URLSearchParams({ token: `invalid-${runID}`, token_type_hint: 'access_token' })],
    ['POST', '/oauth/register', '/oauth/register', {
      client_name: `Beeper CLI E2E ${runID}`,
      grant_types: ['authorization_code'],
      response_types: ['code'],
      redirect_uris: ['http://127.0.0.1:9/callback'],
      scope: 'read write',
      token_endpoint_auth_method: 'none',
    }],
    ['GET', '/v1/search', '/v1/search?query=cli'],
    ['GET', '/v1/accounts', '/v1/accounts'],
    ['GET', '/v1/bridges', '/v1/bridges'],
    ['GET', '/v1/messages/search', '/v1/messages/search?query=cli&limit=5'],
    ['GET', '/v1/chats/search', '/v1/chats/search?query=cli&limit=5'],
    ['GET', '/v1/accounts/{accountID}/contacts', `/v1/accounts/${encodeURIComponent(context.accountID)}/contacts?query=qatest`],
    ['GET', '/v1/accounts/{accountID}/contacts/list', `/v1/accounts/${encodeURIComponent(context.accountID)}/contacts/list?limit=5`],
    ['GET', '/v1/chats', '/v1/chats?limit=5'],
    ['GET', '/v1/chats/{chatID}', `/v1/chats/${encodeURIComponent(context.chatID)}`],
    ['GET', '/v1/chats/{chatID}/messages', `/v1/chats/${encodeURIComponent(context.chatID)}/messages?limit=5`],
    ['GET', '/v1/chats/{chatID}/messages/{messageID}', `/v1/chats/${encodeURIComponent(context.chatID)}/messages/${encodeURIComponent(context.messageID ?? context.pendingMessageID ?? 'missing-message-id')}`],
    ['PUT', '/_matrix/client/v3/user/{userId}/account_data/{type}', `/_matrix/client/v3/user/${encodeURIComponent(instance.userID ?? 'missing-user')}/account_data/${encodeURIComponent(`com.beeper.cli_e2e.${runID}`)}`, { runID, scope: 'user' }],
    ['GET', '/_matrix/client/v3/user/{userId}/account_data/{type}', `/_matrix/client/v3/user/${encodeURIComponent(instance.userID ?? 'missing-user')}/account_data/${encodeURIComponent(`com.beeper.cli_e2e.${runID}`)}`],
    ['PUT', '/_matrix/client/v3/user/{userId}/rooms/{roomId}/account_data/{type}', `/_matrix/client/v3/user/${encodeURIComponent(instance.userID ?? 'missing-user')}/rooms/${encodeURIComponent(context.chatID)}/account_data/${encodeURIComponent(`com.beeper.cli_e2e.${runID}`)}`, { runID, scope: 'room' }],
    ['GET', '/_matrix/client/v3/user/{userId}/rooms/{roomId}/account_data/{type}', `/_matrix/client/v3/user/${encodeURIComponent(instance.userID ?? 'missing-user')}/rooms/${encodeURIComponent(context.chatID)}/account_data/${encodeURIComponent(`com.beeper.cli_e2e.${runID}`)}`],
    ['GET', '/v1/assets/serve', `/v1/assets/serve?url=${encodeURIComponent(uploadedAsset?.srcURL ?? uploadedAsset?.url ?? `mxc://invalid/${runID}`)}`],
    ['GET', '/_matrix/client/v3/rooms/{roomId}/state', `/_matrix/client/v3/rooms/${encodeURIComponent(context.chatID)}/state`],
    ['GET', '/_matrix/client/v3/rooms/{roomId}/state/{eventType}/{stateKey}', `/_matrix/client/v3/rooms/${encodeURIComponent(context.chatID)}/state/${encodeURIComponent('m.room.create')}/`],
    ['GET', '/_matrix/client/v3/rooms/{roomId}/event/{eventId}', `/_matrix/client/v3/rooms/${encodeURIComponent(context.chatID)}/event/${encodeURIComponent(context.matrixEventID ?? context.messageID ?? 'missing-event-id')}`],
    ['GET', '/_matrix/client/v3/profile/{userId}', `/_matrix/client/v3/profile/${encodeURIComponent(instance.userID ?? 'missing-user')}`],
    ['POST', '/_matrix/client/v3/join/{roomIdOrAlias}', `/_matrix/client/v3/join/${encodeURIComponent(context.chatID)}`, {}],
    ['POST', '/_matrix/client/v3/rooms/{roomId}/leave', `/_matrix/client/v3/rooms/${encodeURIComponent(matrixRoomForLeave ?? '!invalid-cli-e2e-room:beeper-staging.com')}/leave`, {}],
    ['GET', '/_matrix/client/unstable/com.beeper.bridge/{bridgeID}/_matrix/provision/v3/whoami', bridgeProvisionEndpoint(context, '/v3/whoami')],
    ['GET', '/_matrix/client/unstable/com.beeper.bridge/{bridgeID}/_matrix/provision/v3/login/flows', bridgeProvisionEndpoint(context, '/v3/login/flows')],
    ['GET', '/_matrix/client/unstable/com.beeper.bridge/{bridgeID}/_matrix/provision/v3/logins', bridgeProvisionEndpoint(context, '/v3/logins')],
    ['POST', '/_matrix/client/unstable/com.beeper.bridge/{bridgeID}/_matrix/provision/v3/login/start/{flowID}', bridgeProvisionEndpoint(context, '/v3/login/start/invalid-flow'), {}],
    ['POST', '/_matrix/client/unstable/com.beeper.bridge/{bridgeID}/_matrix/provision/v3/login/step/{loginProcessID}/{stepID}/user_input', bridgeProvisionEndpoint(context, '/v3/login/step/invalid-login/invalid-step/user_input'), {}],
    ['POST', '/_matrix/client/unstable/com.beeper.bridge/{bridgeID}/_matrix/provision/v3/login/step/{loginProcessID}/{stepID}/cookies', bridgeProvisionEndpoint(context, '/v3/login/step/invalid-login/invalid-step/cookies'), { cookies: [] }],
    ['POST', '/_matrix/client/unstable/com.beeper.bridge/{bridgeID}/_matrix/provision/v3/login/step/{loginProcessID}/{stepID}/display_and_wait', bridgeProvisionEndpoint(context, '/v3/login/step/invalid-login/invalid-step/display_and_wait'), {}],
    ['POST', '/_matrix/client/unstable/com.beeper.bridge/{bridgeID}/_matrix/provision/v3/logout/{loginID}', bridgeProvisionEndpoint(context, '/v3/logout/invalid-login'), {}],
    ['GET', '/_matrix/client/unstable/com.beeper.bridge/{bridgeID}/_matrix/provision/v3/contacts', bridgeProvisionEndpoint(context, '/v3/contacts')],
    ['POST', '/_matrix/client/unstable/com.beeper.bridge/{bridgeID}/_matrix/provision/v3/search_users', bridgeProvisionEndpoint(context, '/v3/search_users'), { query: 'qatest' }],
    ['GET', '/_matrix/client/unstable/com.beeper.bridge/{bridgeID}/_matrix/provision/v3/resolve_identifier/{identifier}', bridgeProvisionEndpoint(context, `/v3/resolve_identifier/${encodeURIComponent(instance.userID ?? 'qatest')}`)],
    ['POST', '/_matrix/client/unstable/com.beeper.bridge/{bridgeID}/_matrix/provision/v3/create_dm/{identifier}', bridgeProvisionEndpoint(context, `/v3/create_dm/${encodeURIComponent(instance.userID ?? 'qatest')}`), {}],
    ['POST', '/_matrix/client/unstable/com.beeper.bridge/{bridgeID}/_matrix/provision/v3/create_group/{groupType}', bridgeProvisionEndpoint(context, '/v3/create_group/default'), { name: { name: `CLI E2E ${runID}` } }],
    ['GET', '/_matrix/client/unstable/com.beeper.bridge/{bridgeID}/_matrix/provision/v3/capabilities', bridgeProvisionEndpoint(context, '/v3/capabilities')],
  ]

  const oauthClient = await registerOAuthClientForCoverage(instance, rawChecks, recordCoverage)
  if (oauthClient?.client_id) {
    rawChecks.push(
      ['GET', '/oauth/authorize', `/oauth/authorize?client_id=${encodeURIComponent(oauthClient.client_id)}&redirect_uri=${encodeURIComponent('http://127.0.0.1:9/callback')}&response_type=code&scope=${encodeURIComponent('read write')}&state=${encodeURIComponent(`e2e-${runID}`)}&code_challenge=${encodeURIComponent('invalidchallenge')}&code_challenge_method=S256`],
      ['POST', '/oauth/authorize/callback', '/oauth/authorize/callback', {
        clientInfo: { clientID: oauthClient.client_id, name: `Beeper CLI E2E ${runID}` },
        redirectUri: 'http://127.0.0.1:9/callback',
        scope: 'read write',
        scopes: ['read', 'write'],
        state: `e2e-${runID}`,
        codeChallenge: 'invalidchallenge',
        codeChallengeMethod: 'S256',
      }],
      ['POST', '/oauth/token', '/oauth/token', new URLSearchParams({ grant_type: 'authorization_code', code: 'invalid-code', code_verifier: 'invalid-verifier', client_id: oauthClient.client_id })],
    )
  } else {
    recordCoverage('GET', '/oauth/authorize', { via: 'skipped', reason: 'oauth client registration failed before authorize coverage' })
    recordCoverage('POST', '/oauth/authorize/callback', { via: 'skipped', reason: 'oauth client registration failed before callback coverage' })
    recordCoverage('POST', '/oauth/token', { via: 'skipped', reason: 'oauth client registration failed before token coverage' })
  }

  for (const [method, specPath, endpoint, body] of rawChecks) {
    try {
      const response = await rawRequest(instance, method, endpoint, body)
      report.endpoints.push(await endpointReportEntry(method, endpoint, response))
      recordCoverage(method, specPath, { via: 'raw', endpoint, status: response.status })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      report.endpoints.push({ method, endpoint, error: message })
      recordCoverage(method, specPath, { via: 'raw', endpoint, error: message })
    }
  }

  for (const operation of operationKeys) {
    if (!coveredOperations.has(operation)) {
      report.endpointCoverage.push({ operation, via: 'missing' })
    }
  }
  report.missingOpenAPIOperations = [...operationKeys].filter(operation => !coveredOperations.has(operation)).sort()
  await writeReport()
}

async function runAccountLoginCoverage(instance) {
  await runCli(['accounts', 'add', '--json'], { instance, allowFailure: true })
  coveredCommands.add('accounts add')

  if (!bridgeAccount) {
    report.bridgeAccountLogin = {
      status: 'requires-user-input',
      message: 'Set BEEPER_E2E_BRIDGE_ACCOUNT plus BEEPER_E2E_BRIDGE_FIELD/BEEPER_E2E_BRIDGE_COOKIE/BEEPER_E2E_BRIDGE_FLOW as needed to run a real bridge login flow.',
    }
    if (process.env.BEEPER_E2E_REQUIRE_BRIDGE_ACCOUNT === '1') {
      throw new Error(report.bridgeAccountLogin.message)
    }
    return
  }

  const args = ['accounts', 'add', bridgeAccount, '--json']
  for (const value of splitEnvList(process.env.BEEPER_E2E_BRIDGE_FIELD)) args.push('--field', value)
  for (const value of splitEnvList(process.env.BEEPER_E2E_BRIDGE_COOKIE)) args.push('--cookie', value)
  if (process.env.BEEPER_E2E_BRIDGE_FLOW) args.push('--flow', process.env.BEEPER_E2E_BRIDGE_FLOW)
  if (process.env.BEEPER_E2E_BRIDGE_LOGIN_ID) args.push('--login-id', process.env.BEEPER_E2E_BRIDGE_LOGIN_ID)
  args.push('--non-interactive')
  await runCli(args, { instance, allowFailure: true })
  report.bridgeAccountLogin = {
    status: 'attempted',
    bridgeAccount,
  }
}

function commandEndpointCoverage() {
  return [
    ['POST', '/v1/focus', 'focus'],
    ['POST', '/v1/chats', 'create-chat'],
    ['POST', '/v1/chats/start', 'start-chat'],
    ['PATCH', '/v1/chats/{chatID}', 'draft, clear-draft, mute, title, description, avatar, etc.'],
    ['POST', '/v1/chats/{chatID}/archive', 'archive, unarchive'],
    ['POST', '/v1/chats/{chatID}/reminders', 'remind'],
    ['DELETE', '/v1/chats/{chatID}/reminders', 'unremind'],
    ['POST', '/v1/chats/{chatID}/read', 'read, mark-read'],
    ['POST', '/v1/chats/{chatID}/unread', 'unread, mark-unread'],
    ['POST', '/v1/chats/{chatID}/notify-anyway', 'notify-anyway'],
    ['POST', '/v1/chats/{chatID}/messages', 'send, reply, send-file, reply-file'],
    ['PUT', '/v1/chats/{chatID}/messages/{messageID}', 'edit'],
    ['DELETE', '/v1/chats/{chatID}/messages/{messageID}', 'delete-message'],
    ['POST', '/v1/chats/{chatID}/messages/{messageID}/reactions', 'react'],
    ['DELETE', '/v1/chats/{chatID}/messages/{messageID}/reactions/{reactionKey}', 'unreact'],
    ['POST', '/v1/assets/download', 'assets download'],
    ['POST', '/v1/assets/upload', 'assets upload, send-file, reply-file'],
    ['POST', '/v1/app/login/start', 'auth login --app-login'],
    ['POST', '/v1/app/login/email', 'auth login --app-login'],
    ['POST', '/v1/app/login/response', 'auth login --app-login'],
    ['POST', '/v1/app/login/register', 'auth login --app-login for new qatest account'],
    ['GET', '/v1/app/status', 'app status, auth login smart probe'],
    ['POST', '/v1/app/e2ee/recovery-code/verify', 'app e2ee recovery-code verify'],
    ['POST', '/v1/app/e2ee/recovery-code/reset', 'app e2ee recovery-code reset begin'],
    ['POST', '/v1/app/e2ee/recovery-code/reset/confirm', 'app e2ee recovery-code reset confirm'],
    ['POST', '/v1/app/e2ee/recovery-code/mark-backed-up', 'app e2ee recovery-code mark-backed-up'],
    ['POST', '/v1/app/e2ee/verification', 'app e2ee verification start'],
    ['POST', '/v1/app/e2ee/verification/qr/scan', 'app e2ee verification qr scan'],
    ['POST', '/v1/app/e2ee/verification/{verificationID}/accept', 'app e2ee verification accept'],
    ['POST', '/v1/app/e2ee/verification/{verificationID}/cancel', 'app e2ee verification cancel'],
    ['POST', '/v1/app/e2ee/verification/{verificationID}/qr/confirm-scanned', 'app e2ee verification qr confirm-scanned'],
    ['POST', '/v1/app/e2ee/verification/{verificationID}/sas/start', 'app e2ee verification sas start'],
    ['POST', '/v1/app/e2ee/verification/{verificationID}/sas/confirm', 'app e2ee verification sas confirm'],
  ]
}

function bridgeProvisionEndpoint(context, suffix) {
  const bridgeID = process.env.BEEPER_E2E_PROVISION_BRIDGE || bridgeAccount || (context.bridgeID === 'matrix' ? 'discordgo' : context.bridgeID)
  return `/_matrix/client/unstable/com.beeper.bridge/${encodeURIComponent(bridgeID)}/_matrix/provision${suffix}`
}

async function uploadBase64AssetForCoverage(instance, recordCoverage) {
  const endpoint = '/v1/assets/upload/base64'
  const body = {
    content: Buffer.from(`Beeper CLI E2E base64 fixture ${runID}\n`).toString('base64'),
    fileName: 'fixture.txt',
    mimeType: 'text/plain',
  }
  try {
    const response = await rawRequest(instance, 'POST', endpoint, body)
    report.endpoints.push(await endpointReportEntry('POST', endpoint, response))
    recordCoverage('POST', endpoint, { via: 'raw', endpoint, status: response.status })
    if (!response.ok) return undefined
    return response.json()
  } catch (error) {
    recordCoverage('POST', endpoint, {
      via: 'raw',
      endpoint,
      error: error instanceof Error ? error.message : String(error),
    })
    return undefined
  }
}

async function createMatrixRoomForCoverage(instance, recordCoverage) {
  const endpoint = '/_matrix/client/v3/createRoom'
  try {
    const response = await rawRequest(instance, 'POST', endpoint, {
      name: `CLI E2E ${runID}`,
      preset: 'private_chat',
    })
    report.endpoints.push(await endpointReportEntry('POST', endpoint, response))
    recordCoverage('POST', endpoint, { via: 'raw', endpoint, status: response.status })
    if (!response.ok) return undefined
    const body = await response.json()
    return body.room_id ?? body.roomId
  } catch (error) {
    recordCoverage('POST', endpoint, {
      via: 'raw',
      endpoint,
      error: error instanceof Error ? error.message : String(error),
    })
    return undefined
  }
}

async function registerOAuthClientForCoverage(instance, rawChecks, recordCoverage) {
  const registerCheck = rawChecks.find(([method, specPath]) => method === 'POST' && specPath === '/oauth/register')
  if (!registerCheck) return undefined
  const [, specPath, endpoint, body] = registerCheck
  try {
    const response = await rawRequest(instance, 'POST', endpoint, body)
    report.endpoints.push(await endpointReportEntry('POST', endpoint, response))
    recordCoverage('POST', specPath, { via: 'raw', endpoint, status: response.status })
    if (!response.ok) return undefined
    return response.json()
  } catch (error) {
    recordCoverage('POST', specPath, {
      via: 'raw',
      endpoint,
      error: error instanceof Error ? error.message : String(error),
    })
    return undefined
  }
}

async function runWatchAndRpcCommands(instance, context) {
  await runCli(['rpc'], {
    instance,
    input: JSON.stringify({ id: 1, args: ['status', '--json'] }) + '\n',
    timeoutMs: 20_000,
  })
  coveredCommands.add('rpc')

  await runCli(['shell'], {
    instance,
    input: 'status --json\nquit\n',
    timeoutMs: 20_000,
  })
  coveredCommands.add('shell')

  await runCli(['interactive', '--help'], { instance })
  coveredCommands.add('interactive')

  await runCli(['watch', '--json', '--chat', context.chatID], {
    instance,
    timeoutMs: 5000,
    allowTimeout: true,
  })
  coveredCommands.add('watch')
  coveredCommands.add('tail')
}

async function runCleanupCommands(instance) {
  await runCli(['auth', 'logout'], { instance, allowFailure: true })
  await runCli(['logout'], { instance, allowFailure: true })
  await runCli(['config', 'reset'], { instance, allowFailure: true })
  coveredCommands.add('auth logout')
  coveredCommands.add('logout')
  coveredCommands.add('config reset')
}

async function runE2EECommands(instance) {
  const status = parseJSON((await runCli(['app', 'status', '--json'], { instance })).stdout, 'app status')
  if (status.state === 'needs-login') throw new Error('cannot cover app e2ee commands before login')

  await runCli(['app', 'e2ee', 'recovery-code', 'reset', 'begin', '--json'], { instance, allowFailure: true })
  coveredCommands.add('app e2ee recovery-code reset begin')

  const verification = status.verification
  const verificationID = verification?.verificationID || 'missing-verification-id'
  await runCli(['app', 'e2ee', 'verification', 'start', '--json'], { instance, allowFailure: true })
  await runCli(['app', 'e2ee', 'verification', 'accept', verificationID, '--json'], { instance, allowFailure: true })
  await runCli(['app', 'e2ee', 'verification', 'sas', 'start', verificationID, '--json'], { instance, allowFailure: true })
  await runCli(['app', 'e2ee', 'verification', 'sas', 'confirm', verificationID, '--json'], { instance, allowFailure: true })
  await runCli(['app', 'e2ee', 'verification', 'qr', 'scan', 'invalid-e2e-test-qr', '--json'], { instance, allowFailure: true })
  await runCli(['app', 'e2ee', 'verification', 'qr', 'confirm-scanned', verificationID, '--json'], { instance, allowFailure: true })
  await runCli(['app', 'e2ee', 'verification', 'cancel', verificationID, '--reason', 'e2e cleanup', '--json'], { instance, allowFailure: true })
  await runCli(['app', 'e2ee', 'recovery-code', 'verify', 'invalid-e2e-test-code', '--json'], { instance, allowFailure: true })
  await runCli(['app', 'e2ee', 'recovery-code', 'mark-backed-up', '--json'], { instance, allowFailure: true })
  await runCli(['app', 'e2ee', 'recovery-code', 'reset', 'confirm', 'invalid-e2e-test-code', '--json'], { instance, allowFailure: true })

  for (const command of [
    'app e2ee verification start',
    'app e2ee verification accept',
    'app e2ee verification sas start',
    'app e2ee verification sas confirm',
    'app e2ee verification qr scan',
    'app e2ee verification qr confirm-scanned',
    'app e2ee verification cancel',
    'app e2ee recovery-code verify',
    'app e2ee recovery-code mark-backed-up',
    'app e2ee recovery-code reset confirm',
  ]) coveredCommands.add(command)
}

async function runCrossInstanceMessaging(context) {
  if (report.instances.length < 2) return
  for (let index = 1; index < report.instances.length; index++) {
    const sender = report.instances[index]
    const target = report.instances[0]
    if (!target.userID) continue
    await runCli([
      'start-chat',
      '--id', target.userID,
      '--message', `cli e2e cross-instance ${runID} from ${sender.profile}`,
      '--allow-invite',
      '--json',
    ], { instance: sender, allowFailure: true })
  }
}

async function createFixtureFile() {
  const fixture = path.join(workDir, 'fixture.txt')
  await writeFile(fixture, `Beeper CLI E2E fixture ${runID}\n`)
  report.artifacts.fixture = fixture
  return fixture
}

async function runCli(args, options = {}) {
  const commandName = commandFromArgs(args)
  process.stderr.write(`[e2e] ${args.join(' ')}\n`)
  const env = {
    ...process.env,
    ...(options.instance ? {
      BEEPER_CLI_CONFIG_DIR: options.instance.configDir,
      BEEPER_DESKTOP_BASE_URL: options.instance.baseURL,
    } : {}),
  }
  const result = await runProcess(process.execPath, [cliBin, ...args], {
    cwd: repoRoot,
    env,
    input: options.input,
    timeoutMs: options.timeoutMs ?? 60_000,
    allowTimeout: options.allowTimeout,
  })
  const entry = {
    command: args.join(' '),
    commandName,
    code: result.code,
    timedOut: result.timedOut,
    stdoutBytes: result.stdout.length,
    stderr: result.stderr.slice(-2000),
  }
  if (options.record !== false) report.commands.push(entry)
  if (options.record !== false) await writeReport()
  if (result.code === 0 || options.allowFailure || result.timedOut && options.allowTimeout) {
    coveredCommands.add(commandName)
    return result
  }
  throw new Error(`Command failed: ${args.join(' ')}\n${result.stderr}\n${result.stdout}`)
}

function runProcess(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    let settled = false
    let timedOut = false
    const timeout = setTimeout(() => {
      timedOut = true
      child.kill('SIGTERM')
      setTimeout(() => child.kill('SIGKILL'), 2000).unref()
    }, options.timeoutMs ?? 60_000)

    child.stdout.on('data', chunk => { stdout += chunk.toString() })
    child.stderr.on('data', chunk => { stderr += chunk.toString() })
    child.on('error', error => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      reject(error)
    })
    child.on('close', (code, signal) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      if (timedOut && !options.allowTimeout) {
        reject(new Error(`${command} ${args.join(' ')} timed out\n${stderr}\n${stdout}`))
        return
      }
      resolve({ code: code ?? 0, signal, stdout, stderr, timedOut })
    })

    if (options.input) child.stdin.end(options.input)
    else child.stdin.end()
  })
}

function commandFromArgs(args) {
  const aliases = {
    login: 'login',
    logout: 'logout',
    tail: 'tail',
    thread: 'thread',
    threads: 'threads',
    whoami: 'whoami',
    'mark-read': 'mark-read',
    'mark-unread': 'mark-unread',
  }
  const joined = []
  for (const arg of args) {
    if (arg.startsWith('-')) break
    joined.push(arg)
  }
  const key = joined.join(' ')
  if (aliases[key]) return aliases[key]
  return key
}

function parseJSON(stdout, label) {
  try {
    return JSON.parse(stdout)
  } catch (error) {
    throw new Error(`${label} did not return JSON: ${error instanceof Error ? error.message : String(error)}\n${stdout}`)
  }
}

function firstItem(value) {
  const items = firstArray(value)
  return items[0]
}

function firstArray(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.items)) return value.items
  if (Array.isArray(value?.data)) return value.data
  return []
}

function firstWritableChat(chats) {
  return chats.find(chat => chat && !chat.isReadOnly && (chat.id || chat.chatID)) ?? chats.find(chat => chat?.id || chat?.chatID)
}

function authHeaders(instance) {
  return { headers: { Authorization: `Bearer ${instance.accessToken}` } }
}

async function fetchJSON(url, init) {
  const response = await fetchWithTimeout(url, init)
  if (!response.ok) throw new Error(`${url} failed: ${response.status} ${await response.text()}`)
  return response.json()
}

async function rawRequest(instance, method, endpoint, body) {
  const headers = { Authorization: `Bearer ${instance.accessToken}` }
  let requestBody
  if (body instanceof URLSearchParams) {
    headers['content-type'] = 'application/x-www-form-urlencoded'
    requestBody = body
  } else if (body) {
    headers['content-type'] = 'application/json'
    requestBody = JSON.stringify(body)
  }
  return fetchWithTimeout(new URL(endpoint, instance.baseURL), { method, headers, body: requestBody })
}

async function endpointReportEntry(method, endpoint, response) {
  let bodySample
  if (response.status >= 400) {
    try {
      bodySample = (await response.clone().text()).slice(0, 1000)
    } catch {
      bodySample = '<failed to read response body>'
    }
  }
  return { method, endpoint, status: response.status, bodySample }
}

function splitEnvList(value) {
  return value ? value.split(',').map(item => item.trim()).filter(Boolean) : []
}

async function writeReport() {
  await mkdir(path.dirname(reportPath), { recursive: true })
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n')
}

async function cleanup() {
  if (cleanedUp) return
  cleanedUp = true
  await writeReport().catch(() => {})
  if (keepDesktop) return
  for (const { child } of children.reverse()) {
    if (child.exitCode === null) child.kill('SIGTERM')
  }
  await sleep(1000)
  for (const { child } of children.reverse()) {
    if (child.exitCode === null) child.kill('SIGKILL')
    child.stdout?.destroy()
    child.stderr?.destroy()
    child.unref()
  }
  for (const { log } of children) {
    log.destroy()
  }
}

process.on('SIGINT', () => {
  cleanup().finally(() => process.exit(130))
})
process.on('SIGTERM', () => {
  cleanup().finally(() => process.exit(143))
})

main()
  .catch(async error => {
    report.error = error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) }
    await cleanup()
    console.error(error instanceof Error ? error.stack || error.message : String(error))
    process.exit(1)
  })
  .finally(async () => {
    await cleanup()
  })
