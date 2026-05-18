#!/usr/bin/env bun
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
await loadEnvFile(process.env.BEEPER_E2E_ENV_FILE || path.join(repoRoot, '.env.e2e'))

const cliBin = path.join(repoRoot, 'bin/run.js')
const runID = process.env.BEEPER_E2E_RUN_ID || String(Date.now())
const workDir = process.env.BEEPER_E2E_WORKDIR || path.join(tmpdir(), `beeper-cli-e2e-${runID}`)
const configDir = process.env.BEEPER_E2E_CONFIG_DIR || path.join(workDir, 'cli-config')
const reportPath = process.env.BEEPER_E2E_REPORT || path.join(workDir, 'report.json')
const emailBase = Number(process.env.BEEPER_E2E_EMAIL_BASE || (900000 + Math.floor(Math.random() * 50000)))
const otp = process.env.BEEPER_E2E_OTP?.trim()
const accountCount = Number(process.env.BEEPER_E2E_ACCOUNT_COUNT || 3)
const portStart = Number(process.env.BEEPER_E2E_PORT_START || 24_573)
const desktopCount = Number(process.env.BEEPER_E2E_DESKTOP_TARGETS || 1)
const serverCount = Number(process.env.BEEPER_E2E_SERVER_TARGETS || Math.max(1, accountCount - desktopCount))
const phases = (process.env.BEEPER_E2E_PHASES || process.argv.slice(2).join(',') || 'plan')
  .split(',')
  .map(phase => phase.trim())
  .filter(Boolean)

if (phases.includes('login') && !otp) {
  console.error('BEEPER_E2E_OTP is required for the login phase. Set it in the environment and rerun the staging E2E harness.')
  process.exit(1)
}

const report = {
  runID,
  workDir,
  configDir,
  reportPath,
  startedAt: new Date().toISOString(),
  phases,
  targets: [],
  commands: [],
  blocked: [],
  failures: [],
  notes: [],
  coverage: {
    commands: [],
    api: [],
    skipped: [],
  },
}

const previousReport = await readPreviousReport()
if (previousReport?.runID === runID) {
  report.targets = previousReport.targets ?? []
  report.commands = previousReport.commands ?? []
  report.blocked = []
  report.failures = []
  report.notes = previousReport.notes ?? []
  report.coverage = previousReport.coverage ?? report.coverage
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
  if (hasPhase('surface')) await phaseSurface()
  if (hasPhase('cleanup')) await phaseCleanup()

  report.finishedAt = new Date().toISOString()
  await writeReport()
  console.log(`staging e2e report: ${reportPath}`)
  if (report.failures.length) {
    console.error(`${report.failures.length} staging e2e failure${report.failures.length === 1 ? '' : 's'}; see report for details.`)
    process.exitCode = 1
  } else if (report.blocked.length) {
    console.error(`${report.blocked.length} staging e2e manual block${report.blocked.length === 1 ? '' : 's'}; see report for next actions.`)
    process.exitCode = 2
  }
}

async function phasePlan() {
  const targets = plannedTargets()
  report.targets = targets
  const commands = [
    'bun run --filter beeper-cli build',
    `BEEPER_E2E_ENV_FILE=.env.e2e BEEPER_E2E_PHASES=targets,install-server,start,login,readiness,verify,messaging,surface,cleanup BEEPER_E2E_RUN_ID=${runID} bun packages/cli/test/e2e-staging.ts`,
    `BEEPER_CLI_CONFIG_DIR=${configDir} bun packages/cli/bin/run.js targets list --json`,
  ]
  report.commands.push(...commands.map(command => ({ phase: 'plan', command })))
  report.notes.push('Default phase is plan only. Add explicit BEEPER_E2E_PHASES before launching targets.')
  report.notes.push('Put BEEPER_E2E_OTP in .env.e2e or set BEEPER_E2E_ENV_FILE. The report redacts OTPs, access tokens, lead tokens, and setup responses.')
  report.notes.push('The harness uses non-default ports and an isolated BEEPER_CLI_CONFIG_DIR so the default Desktop instance is not used.')
  report.notes.push('install-server downloads Beeper Server. Use that phase only when you intend to download the staging server artifact.')
  printPlan(targets, commands)
}

async function phaseTargets() {
  const targets = plannedTargets()
  report.targets = targets
  for (const target of targets) {
    const args = target.kind === 'desktop'
      ? ['targets', 'create', 'desktop', target.name, '--server-env', 'staging', '--port', String(target.port), '--json']
      : ['targets', 'create', 'server', target.name, '--server-env', 'staging', '--port', String(target.port), '--json']
    const result = runCli(args, { allowFailure: true })
    if (result.status !== 0 && !`${result.stderr}${result.stdout}`.includes('already exists')) fail(result, args)
    recordCommand('targets', args, result)
    await writeReport()
  }
  const list = runCli(['targets', 'list', '--json'])
  recordCommand('targets', ['targets', 'list', '--json'], list)
  await writeReport()
}

async function phaseInstallServer() {
  const result = runCli(['install', 'server', '--server-env', 'staging', '--json'])
  recordCommand('install-server', ['install', 'server', '--server-env', 'staging', '--json'], result)
  await writeReport()
}

async function phaseStart() {
  for (const target of plannedTargets()) {
    const args = ['targets', 'start', target.name, '--json']
    const result = runCli(args, { env: serverEnv(), allowFailure: true })
    recordCommand('start', args, result)
    if (result.status !== 0) {
      recordFailure('start', target, result.stderr || result.stdout)
      continue
    }
    try {
      await waitForInfo(target)
    } catch (error) {
      recordFailure('start', target, error)
    }
    await writeReport()
  }
}

async function phaseLogin() {
  for (const target of plannedTargets()) {
    try {
      await waitForInfo(target)
      if (target.kind === 'server') {
        if (!await loginServerViaSetupAPI(target)) continue
      } else {
        const args = ['setup', '--target', target.name, '--local', '--json']
        const result = runCli(args, { allowFailure: true })
        recordCommand('login', args, result)
        if (result.status !== 0) {
          recordLoginBlock(target, args, result)
          continue
        }
        const body = parseEnvelope(result.stdout)
        target.matrix = body?.data?.readiness?.app?.matrix
      }
      target.accessToken = await loadTargetAccessToken(target)
      assert(target.accessToken, `setup did not persist an access token for ${target.name}`)
      report.notes.push(`authenticated ${target.name} with ${target.kind === 'desktop' ? 'local Desktop session' : 'setup API'}`)
    } catch (error) {
      recordFailure('login', target, error)
    }
    await writeReport()
  }
}

async function phaseReadiness() {
  for (const target of await plannedTargetsWithAuth()) {
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
  const targets = (await plannedTargetsWithAuth()).filter(target => target.accessToken)
  if (targets.length < 2) {
    recordBlock('verify', undefined, 'verify phase needs at least two signed-in targets for device-to-device auth.', [
      `BEEPER_E2E_RUN_ID=${runID} BEEPER_E2E_OTP="$QA_OTP" BEEPER_E2E_PHASES=login bun packages/cli/test/e2e-staging.ts`,
      `BEEPER_E2E_RUN_ID=${runID} BEEPER_E2E_PHASES=verify,readiness bun packages/cli/test/e2e-staging.ts`,
    ])
    return
  }
  await phaseVerifySameAccountDevices(targets)
  for (const target of targets) {
    for (const args of [
      ['verify', 'status', '--target', target.name, '--json'],
      ['verify', 'list', '--target', target.name, '--json'],
      ['verify', 'show', '--target', target.name, '--json'],
      ['verify', 'sas', '--target', target.name, '--json'],
      ['verify', 'sas-confirm', '--target', target.name, '--json'],
    ]) {
      const result = runCli(args, { env: { BEEPER_ACCESS_TOKEN: target.accessToken }, allowFailure: true })
      recordCommand('verify', args, result)
    }
  }
  report.notes.push('Review verify command results. SAS/QR often needs manual matching between the two target UIs.')
}

async function phaseMessaging() {
  const signedInTargets = (await plannedTargetsWithAuth()).filter(target => target.accessToken)
  const sender = signedInTargets[0]
  const receiver = signedInTargets.find(target => target.matrix?.userID && target.matrix.userID !== sender?.matrix?.userID)
  if (!sender || !receiver?.matrix?.userID) {
    recordBlock('messaging', undefined, 'messaging phase needs two signed-in targets with Matrix user IDs.', [
      `BEEPER_E2E_RUN_ID=${runID} BEEPER_E2E_OTP="$QA_OTP" BEEPER_E2E_PHASES=login,readiness bun packages/cli/test/e2e-staging.ts`,
      `BEEPER_E2E_RUN_ID=${runID} BEEPER_E2E_PHASES=messaging bun packages/cli/test/e2e-staging.ts`,
    ])
    return
  }
  const env = { BEEPER_ACCESS_TOKEN: sender.accessToken }
  const startArgs = ['chats', 'start', receiver.matrix.userID, '--target', sender.name, '--account', 'matrix', '--json']
  const start = runCli(startArgs, { env, allowFailure: true })
  recordCommand('messaging', startArgs, start)
  const body = parseEnvelope(start.stdout)
  let chatID = body?.data?.chat?.id ?? body?.data?.id ?? body?.data?.chatID
  if (!chatID && /uninitialized undefined account: hungryserv/i.test(start.stderr)) {
    const createRoomBody = JSON.stringify({
      invite: [receiver.matrix.userID],
      is_direct: true,
      preset: 'trusted_private_chat',
    })
    const createRoomArgs = ['api', 'post', '/_matrix/client/v3/createRoom', '--target', sender.name, '--body', createRoomBody, '--json']
    const createRoom = runCli(createRoomArgs, { env, allowFailure: true })
    recordCommand('messaging', createRoomArgs, createRoom)
    chatID = parseEnvelope(createRoom.stdout)?.data?.room_id
  }
  if (!chatID) {
    recordFailure('messaging', sender, 'Could not infer chat ID from chats start; run send/list commands manually with the chat ID from the target UI.')
    return
  }
  for (const args of [
    ['send', 'text', '--to', chatID, '--message', `staging e2e ${runID}`, '--target', sender.name, '--json'],
    ['messages', 'list', '--chat', chatID, '--target', sender.name, '--limit', '10', '--json'],
    ['chats', 'show', '--chat', chatID, '--target', sender.name, '--json'],
  ]) {
    const result = runCli(args, { env, allowFailure: true })
    recordCommand('messaging', args, result)
    if (result.status !== 0) recordFailure('messaging', sender, `beeper ${args.join(' ')} failed\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`)
  }
  if (signedInTargets.length >= 3) await phaseGroupMessaging(signedInTargets)
}

async function phaseGroupMessaging(targets) {
  const [sender, ...receivers] = targets.filter(target => target.accessToken && target.matrix?.userID)
  if (!sender || receivers.length < 2) {
    recordBlock('messaging', undefined, 'group messaging needs three signed-in targets with Matrix user IDs.')
    return
  }

  const roomName = `CLI E2E ${runID}`
  const createRoomBody = JSON.stringify({
    invite: receivers.slice(0, 2).map(target => target.matrix.userID),
    name: roomName,
    preset: 'trusted_private_chat',
  })
  const createRoomArgs = ['api', 'post', '/_matrix/client/v3/createRoom', '--target', sender.name, '--body', createRoomBody, '--json']
  const createRoom = runCli(createRoomArgs, { env: { BEEPER_ACCESS_TOKEN: sender.accessToken }, allowFailure: true })
  recordCommand('messaging-group', createRoomArgs, createRoom)
  const chatID = parseEnvelope(createRoom.stdout)?.data?.room_id
  if (!chatID) {
    recordFailure('messaging-group', sender, 'Could not create Matrix group room through the raw API fallback.')
    return
  }

  const text = `group staging e2e ${runID}`
  const sendArgs = ['send', 'text', '--to', chatID, '--message', text, '--target', sender.name, '--json']
  const send = runCli(sendArgs, { env: { BEEPER_ACCESS_TOKEN: sender.accessToken }, allowFailure: true })
  recordCommand('messaging-group', sendArgs, send)

  for (const target of [sender, ...receivers.slice(0, 2)]) {
    const listArgs = ['messages', 'list', '--chat', chatID, '--target', target.name, '--limit', '10', '--json']
    const list = runCli(listArgs, { env: { BEEPER_ACCESS_TOKEN: target.accessToken }, allowFailure: true })
    recordCommand('messaging-group', listArgs, list)
    if (list.status !== 0) recordFailure('messaging-group', target, `group message list failed for ${target.name}`)
  }
}

async function phaseSurface() {
  await phaseApiSurface()
  await phaseCliSurface()
}

async function phaseApiSurface() {
  const target = (await plannedTargetsWithAuth()).find(item => item.accessToken)
  if (!target) {
    recordBlock('api-surface', undefined, 'API surface coverage needs at least one signed-in target.')
    return
  }

  const env = { BEEPER_ACCESS_TOKEN: target.accessToken }
  for (const args of [
    ['api', 'request', 'GET', '/v1/info', '--target', target.name, '--no-auth', '--json'],
    ['api', 'request', 'GET', '/v1/spec', '--target', target.name, '--no-auth', '--json'],
    ['api', 'request', 'GET', '/v1/app', '--target', target.name, '--json'],
    ['api', 'request', 'GET', '/v1/app/verifications', '--target', target.name, '--json'],
    ['api', 'get', '/v1/accounts', '--target', target.name, '--json'],
    ['api', 'get', '/v1/chats?limit=10', '--target', target.name, '--json'],
    ['api', 'get', '/v1/contacts?limit=10', '--target', target.name, '--json'],
  ]) {
    const result = runCli(args, { env, allowFailure: true })
    recordCommand('api-surface', args, result)
    recordCoverage('api', args, result)
  }

  const specResult = runCli(['api', 'request', 'GET', '/v1/spec', '--target', target.name, '--no-auth', '--json'], { allowFailure: true })
  const spec = parseEnvelope(specResult.stdout)?.data ?? parseEnvelope(specResult.stdout)
  const paths = spec?.paths && typeof spec.paths === 'object' ? Object.keys(spec.paths).sort() : []
  if (paths.length) {
    report.coverage.apiSpecPaths = paths.length
    report.coverage.skipped.push(...paths
      .filter(pathname => !isCoveredByCliSurface(pathname))
      .map(pathname => ({ phase: 'api-surface', path: pathname, reason: 'covered by SDK command, destructive side effect, multipart upload, websocket, or requires test-created resource IDs' })))
  }
}

async function phaseCliSurface() {
  const targets = (await plannedTargetsWithAuth()).filter(item => item.accessToken)
  const target = targets[0]
  if (!target) {
    recordBlock('cli-surface', undefined, 'CLI surface coverage needs at least one signed-in target.')
    return
  }
  const env = { BEEPER_ACCESS_TOKEN: target.accessToken }
  const chatID = await findReusableChatID(target, env)
  const messageID = chatID ? await findReusableMessageID(target, chatID, env) : undefined
  const reminderAt = new Date(Date.now() + 86_400_000).toISOString()

  const cases = [
    ['status', '--target', target.name, '--json'],
    ['doctor', '--target', target.name, '--json'],
    ['auth', 'status', '--target', target.name, '--json'],
    ['accounts', 'list', '--target', target.name, '--json'],
    ['accounts', 'add', '--target', target.name, '--json'],
    ['chats', 'list', '--target', target.name, '--limit', '20', '--json'],
    ['chats', 'search', runID, '--target', target.name, '--limit', '10', '--json'],
    ['contacts', 'list', '--target', target.name, '--limit', '20', '--json'],
    ['contacts', 'search', 'qatest', '--target', target.name, '--json'],
    ['verify', 'status', '--target', target.name, '--json'],
    ['verify', 'list', '--target', target.name, '--json'],
  ]

  if (chatID) {
    cases.push(
      ['chats', 'show', '--chat', chatID, '--target', target.name, '--json'],
      ['chats', 'pin', '--chat', chatID, '--target', target.name, '--json'],
      ['chats', 'unpin', '--chat', chatID, '--target', target.name, '--json'],
      ['chats', 'archive', '--chat', chatID, '--target', target.name, '--json'],
      ['chats', 'unarchive', '--chat', chatID, '--target', target.name, '--json'],
      ['chats', 'mute', '--chat', chatID, '--target', target.name, '--json'],
      ['chats', 'unmute', '--chat', chatID, '--target', target.name, '--json'],
      ['chats', 'mark-read', '--chat', chatID, '--target', target.name, '--json'],
      ['chats', 'mark-unread', '--chat', chatID, '--target', target.name, '--json'],
      ['chats', 'priority', '--chat', chatID, '--level', 'inbox', '--target', target.name, '--json'],
      ['chats', 'description', '--chat', chatID, '--description', `CLI E2E ${runID}`, '--target', target.name, '--json'],
      ['chats', 'description', '--chat', chatID, '--clear', '--target', target.name, '--json'],
      ['chats', 'draft', '--chat', chatID, '--text', `draft ${runID}`, '--target', target.name, '--json'],
      ['chats', 'draft', '--chat', chatID, '--clear', '--target', target.name, '--json'],
      ['chats', 'disappear', '--chat', chatID, '--seconds', 'off', '--target', target.name, '--json'],
      ['chats', 'remind', '--chat', chatID, '--when', reminderAt, '--target', target.name, '--json'],
      ['chats', 'unremind', '--chat', chatID, '--target', target.name, '--json'],
      ['presence', '--chat', chatID, '--state', 'typing', '--duration', '1', '--target', target.name, '--json'],
      ['messages', 'list', '--chat', chatID, '--target', target.name, '--limit', '10', '--json'],
      ['messages', 'search', runID, '--chat', chatID, '--target', target.name, '--limit', '10', '--json'],
      ['messages', 'export', '--chat', chatID, '--target', target.name, '--limit', '10', '--output', '-', '--json'],
      ['send', 'text', '--to', chatID, '--message', `surface ${runID}`, '--target', target.name, '--json'],
    )
  }

  if (chatID && messageID) {
    cases.push(
      ['messages', 'show', '--chat', chatID, '--id', messageID, '--target', target.name, '--json'],
      ['messages', 'context', '--chat', chatID, '--id', messageID, '--target', target.name, '--before', '2', '--after', '2', '--json'],
      ['send', 'react', '--to', chatID, '--id', messageID, '--reaction', '+1', '--target', target.name, '--json'],
      ['send', 'unreact', '--to', chatID, '--id', messageID, '--reaction', '+1', '--target', target.name, '--json'],
      ['api', 'request', 'DELETE', `/v1/chats/${encodeURIComponent(chatID)}/messages/${encodeURIComponent(messageID)}/reactions`, '--body', '{"reactionKey":"+1"}', '--target', target.name, '--json'],
    )
  }

  for (const args of cases) {
    const result = runCli(args, { env, allowFailure: true })
    recordCommand('cli-surface', args, result)
    recordCoverage('commands', args, result)
    if (args[0] === 'accounts' && args[1] === 'add') {
      recordBlock('cli-surface', target, 'accounts add intentionally stops before adding network accounts; that flow remains manual.')
    } else if (result.status !== 0) {
      recordFailure('cli-surface', target, `beeper ${args.join(' ')} failed with status ${result.status}`)
    }
  }
}

async function phaseVerifySameAccountDevices(targets) {
  const byUserID = new Map()
  for (const target of targets) {
    const userID = target.matrix?.userID
    if (!userID) continue
    const group = byUserID.get(userID) ?? []
    group.push(target)
    byUserID.set(userID, group)
  }

  const pair = [...byUserID.values()].find(group => group.length >= 2)
  if (!pair) {
    recordBlock('verify', undefined, 'Device-to-device verification needs two targets signed into the same QA account.', [
      `BEEPER_E2E_OTP="$QA_OTP" BEEPER_E2E_EMAIL_1=qatest+123456@beeper.com BEEPER_E2E_EMAIL_2=qatest+123456@beeper.com BEEPER_E2E_EMAIL_3=qatest+123457@beeper.com BEEPER_E2E_ACCOUNT_COUNT=3 BEEPER_E2E_DESKTOP_TARGETS=0 BEEPER_E2E_SERVER_TARGETS=3 BEEPER_E2E_PHASES=targets,install-server,start,login,readiness,verify,messaging,cleanup bun packages/cli/test/e2e-staging.ts`,
    ])
    return
  }

  const [initiator, responder] = await verificationPair(pair)
  const startArgs = ['verify', 'start', '--target', initiator.name, '--user', responder.matrix.userID, '--json']
  const start = runCli(startArgs, { env: { BEEPER_ACCESS_TOKEN: initiator.accessToken }, allowFailure: true })
  recordCommand('verify-devices', startArgs, start)

  const responderResults = await pollResponderVerification(responder)
  const responderVerificationID = verificationIDFromResults(responderResults)
  for (const baseArgs of [
    ['verify', 'approve', '--target', responder.name],
    ['verify', 'sas', '--target', responder.name],
  ]) {
    const args = responderVerificationID ? [...baseArgs, '--id', responderVerificationID, '--json'] : [...baseArgs, '--json']
    const result = runCli(args, { env: { BEEPER_ACCESS_TOKEN: responder.accessToken }, allowFailure: true })
    recordCommand('verify-devices', args, result)
  }
  await sleep(1000)

  const initiatorSASArgs = responderVerificationID
    ? ['verify', 'sas', '--target', initiator.name, '--id', responderVerificationID, '--json']
    : ['verify', 'sas', '--target', initiator.name, '--json']
  const initiatorSAS = runCli(initiatorSASArgs, { env: { BEEPER_ACCESS_TOKEN: initiator.accessToken }, allowFailure: true })
  recordCommand('verify-devices', initiatorSASArgs, initiatorSAS)
  await sleep(1000)

  for (const args of [
    ['verify', 'show', '--target', responder.name, '--json'],
    ['verify', 'show', '--target', initiator.name, '--json'],
    ['verify', 'status', '--target', initiator.name, '--json'],
    ['verify', 'status', '--target', responder.name, '--json'],
  ]) {
    const target = args.includes(initiator.name) ? initiator : responder
    const result = runCli(args, { env: { BEEPER_ACCESS_TOKEN: target.accessToken }, allowFailure: true })
    recordCommand('verify-devices', args, result)
  }

  for (const target of [initiator, responder]) {
    const args = responderVerificationID
      ? ['verify', 'sas-confirm', '--target', target.name, '--id', responderVerificationID, '--json']
      : ['verify', 'sas-confirm', '--target', target.name, '--json']
    const result = runCli(args, { env: { BEEPER_ACCESS_TOKEN: target.accessToken }, allowFailure: true })
    recordCommand('verify-devices', args, result)
  }
  await sleep(1000)
  for (const args of [
    ['verify', 'status', '--target', initiator.name, '--json'],
    ['verify', 'status', '--target', responder.name, '--json'],
  ]) {
    const target = args.includes(initiator.name) ? initiator : responder
    const result = runCli(args, { env: { BEEPER_ACCESS_TOKEN: target.accessToken }, allowFailure: true })
    recordCommand('verify-devices', args, result)
  }
}

async function verificationPair(pair) {
  const states = []
  for (const target of pair) {
    const args = ['verify', 'status', '--target', target.name, '--json']
    const result = runCli(args, { env: { BEEPER_ACCESS_TOKEN: target.accessToken }, allowFailure: true })
    recordCommand('verify-devices', args, result)
    const data = parseEnvelope(result.stdout)?.data
    states.push({ target, verified: data?.app?.e2ee?.verified === true })
  }
  const initiator = states.find(item => !item.verified)?.target ?? pair[0]
  const responder = states.find(item => item.target !== initiator && item.verified)?.target ?? pair.find(target => target !== initiator) ?? pair[1]
  return [initiator, responder]
}

async function pollResponderVerification(responder) {
  const results = []
  for (let attempt = 0; attempt < 12; attempt++) {
    const listArgs = ['verify', 'list', '--target', responder.name, '--json']
    const list = runCli(listArgs, { env: { BEEPER_ACCESS_TOKEN: responder.accessToken }, allowFailure: true })
    recordCommand('verify-devices', listArgs, list)
    results.push(list)
    if (verificationIDFromResults([list])) {
      const showArgs = ['verify', 'show', '--target', responder.name, '--json']
      const show = runCli(showArgs, { env: { BEEPER_ACCESS_TOKEN: responder.accessToken }, allowFailure: true })
      recordCommand('verify-devices', showArgs, show)
      results.push(show)
      return results
    }
    await sleep(1000)
  }
  return results
}

function verificationIDFromResults(results) {
  for (const result of results) {
    const data = parseEnvelope(result.stdout)?.data
    if (Array.isArray(data) && data[0]?.id) return data[0].id
    if (data?.id) return data.id
  }
  return undefined
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

async function plannedTargetsWithAuth() {
  const targets = plannedTargets()
  for (const target of targets) {
    if (!target.accessToken || target.accessToken === '[redacted]') {
      try {
        target.accessToken = await loadTargetAccessToken(target)
      } catch {
        // target has not reached login yet
      }
    }
  }
  return targets
}

function targetPlan(kind, index, ordinal) {
  const email = process.env[`BEEPER_E2E_EMAIL_${ordinal + 1}`] || `qatest+${emailBase + ordinal}@beeper.com`
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
    command: redactCommandOutput(`beeper ${args.join(' ')}`),
    status: result.status,
    stdout: redactCommandOutput(result.stdout).slice(0, 4000),
    stderr: redactCommandOutput(result.stderr).slice(0, 4000),
  })
}

function recordFailure(phase, target, error) {
  const message = error instanceof Error ? error.message : String(error)
  const failure = { phase, target: target?.name, message }
  report.failures.push(failure)
  report.notes.push(`${phase} failed${target?.name ? ` for ${target.name}` : ''}: ${message}`)
}

function redactCommandOutput(value) {
  let redacted = String(value)
    .replace(/"accessToken"\s*:\s*"[^"]+"/g, '"accessToken":"[redacted]"')
    .replace(/"access_token"\s*:\s*"[^"]+"/g, '"access_token":"[redacted]"')
    .replace(/"leadToken"\s*:\s*"[^"]+"/g, '"leadToken":"[redacted]"')
    .replace(/"response"\s*:\s*"[^"]+"/g, '"response":"[redacted]"')
  if (otp) redacted = redacted.split(otp).join('[redacted]')
  return redacted
}

function recordBlock(phase, target, message, actions = []) {
  const block = { phase, target: target?.name, message, actions }
  report.blocked.push(block)
  report.notes.push(`${phase} blocked${target?.name ? ` for ${target.name}` : ''}: ${message}`)
}

function recordLoginBlock(target, args, result) {
  const output = `${result.stderr}${result.stdout}`
  const command = `beeper ${args.join(' ')}`
  if (target.kind === 'desktop' && /signed-in local Beeper Desktop session|missing access_token/i.test(output)) {
    recordBlock('login', target, 'Sign in to the isolated Desktop target, then rerun the login/readiness phases.', [
      `BEEPER_CLI_CONFIG_DIR=${configDir} bun packages/cli/bin/run.js targets start ${target.name} --json`,
      `BEEPER_CLI_CONFIG_DIR=${configDir} bun packages/cli/bin/run.js setup --target ${target.name} --local --json`,
      `BEEPER_E2E_RUN_ID=${runID} BEEPER_E2E_OTP="$QA_OTP" BEEPER_E2E_PHASES=login,readiness bun packages/cli/test/e2e-staging.ts`,
    ])
    return
  }
  if (target.kind === 'server' && /OAuth authorization failed|needs-login|server_error/i.test(output)) {
    recordBlock('login', target, 'Complete Server setup sign-in, then rerun the login/readiness phases.', [
      `BEEPER_CLI_CONFIG_DIR=${configDir} bun packages/cli/bin/run.js targets start ${target.name} --json`,
      `BEEPER_CLI_CONFIG_DIR=${configDir} bun packages/cli/bin/run.js api post /v1/app/setup/start --target ${target.name} --no-auth`,
      `BEEPER_E2E_RUN_ID=${runID} BEEPER_E2E_OTP="$QA_OTP" BEEPER_E2E_PHASES=login,readiness bun packages/cli/test/e2e-staging.ts`,
    ])
    return
  }
  recordFailure('login', target, new Error(`${command} failed\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`))
}

async function loginServerViaSetupAPI(target) {
  const setupApi = (path, body) => {
    const args = ['api', 'post', path, '--target', target.name, '--no-auth']
    if (body !== undefined) args.push('--body', body)
    args.push('--json')
    return args
  }
  const runStep = (args) => {
    const result = runCli(args, { allowFailure: true })
    recordCommand('login', args, result)
    if (result.status !== 0) recordLoginBlock(target, args, result)
    return result
  }

  const start = runStep(setupApi('/v1/app/setup/start'))
  if (start.status !== 0) return false
  const setupRequestID = parseEnvelope(start.stdout)?.data?.setupRequestID
  if (!setupRequestID) {
    recordFailure('login', target, `setup start did not return setupRequestID for ${target.name}`)
    return false
  }

  const email = runStep(setupApi('/v1/app/setup/email', JSON.stringify({ setupRequestID, email: target.email })))
  if (email.status !== 0) return false

  const response = runStep(setupApi('/v1/app/setup/response', JSON.stringify({ setupRequestID, response: otp })))
  if (response.status !== 0) return false

  let data = parseEnvelope(response.stdout)?.data
  if (data?.registrationRequired) {
    const registerBody = JSON.stringify({
      acceptTerms: true,
      leadToken: data.leadToken,
      setupRequestID: data.setupRequestID ?? setupRequestID,
      username: usernameForEmail(target.email) ?? data.usernameSuggestions?.[0],
    })
    const register = runStep(setupApi('/v1/app/setup/register', registerBody))
    if (register.status !== 0) return false
    data = parseEnvelope(register.stdout)?.data
  }

  const token = data?.matrix?.accessToken
  if (!token) {
    recordFailure('login', target, `setup API did not return a Matrix access token for ${target.name}`)
    return false
  }
  target.matrix = {
    deviceID: data.matrix.deviceID,
    homeserver: data.matrix.homeserver,
    userID: data.matrix.userID,
  }
  await saveTargetAuth(target, {
    accessToken: token,
    source: 'manual',
    tokenType: 'Bearer',
  })
  return true
}

async function saveTargetAuth(target, auth) {
  const targetPath = path.join(configDir, 'targets', `${target.name}.json`)
  const current = JSON.parse(await readFile(targetPath, 'utf8'))
  await writeFile(targetPath, `${JSON.stringify({ ...current, auth }, null, 2)}\n`, { mode: 0o600 })
}

function usernameForEmail(email) {
  const digits = email.match(/\+(\d+)@/)?.[1]
  return digits ? `qatest${digits}` : undefined
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

async function loadTargetAccessToken(target) {
  const targetPath = path.join(configDir, 'targets', `${target.name}.json`)
  const current = JSON.parse(await readFile(targetPath, 'utf8'))
  return current.auth?.accessToken
}

function parseEnvelope(stdout) {
  try {
    return JSON.parse(stdout)
  } catch {
    return undefined
  }
}

async function findReusableChatID(target, env) {
  const result = runCli(['chats', 'list', '--target', target.name, '--limit', '20', '--json'], { env, allowFailure: true })
  recordCommand('surface-setup', ['chats', 'list', '--target', target.name, '--limit', '20', '--json'], result)
  const items = parseEnvelope(result.stdout)?.data
  const chat = Array.isArray(items) ? items.find(item => item?.id || item?.localChatID || item?.chatID) : undefined
  if (!chat) {
    recordBlock('cli-surface', target, 'No reusable chat found. Messaging phase should create one, or provide existing signed-in QA accounts with Beeper chats.')
    return undefined
  }
  return chat.localChatID ?? chat.id ?? chat.chatID
}

async function findReusableMessageID(target, chatID, env) {
  const result = runCli(['messages', 'list', '--chat', chatID, '--target', target.name, '--limit', '20', '--json'], { env, allowFailure: true })
  recordCommand('surface-setup', ['messages', 'list', '--chat', chatID, '--target', target.name, '--limit', '20', '--json'], result)
  const items = parseEnvelope(result.stdout)?.data
  const message = Array.isArray(items) ? items.find(item => item?.id || item?.messageID || item?.eventID) : undefined
  if (!message) {
    recordBlock('cli-surface', target, 'No reusable message found. Send a message or run the messaging phase before message-specific surface tests.')
    return undefined
  }
  return message.id ?? message.messageID ?? message.eventID
}

function recordCoverage(type, args, result) {
  report.coverage[type].push({
    command: `beeper ${redactCommandOutput(args.join(' '))}`,
    status: result.status,
    ok: result.status === 0,
  })
}

function isCoveredByCliSurface(pathname) {
  return [
    '/v1/info',
    '/v1/spec',
    '/v1/app',
    '/v1/app/verifications',
    '/v1/accounts',
    '/v1/chats',
    '/v1/contacts',
    '/v1/messages',
    '/v1/assets',
  ].some(prefix => pathname.startsWith(prefix))
}

function serverEnv() {
  const env = {}
  if (process.env.BEEPER_SERVER_BIN) env.BEEPER_SERVER_BIN = process.env.BEEPER_SERVER_BIN
  return env
}

function hasPhase(name) {
  return phases.includes(name) || phases.includes('all')
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function writeReport() {
  await mkdir(path.dirname(reportPath), { recursive: true })
  await writeFile(reportPath, `${JSON.stringify(redactReport(report), null, 2)}\n`)
}

function redactReport(value) {
  return JSON.parse(JSON.stringify(value, (key, innerValue) => {
    if (key === 'accessToken' || key === 'access_token' || key === 'leadToken') return '[redacted]'
    if (key === 'response' && innerValue === otp) return '[redacted]'
    return innerValue
  }))
}

async function loadEnvFile(envPath) {
  if (!envPath) return
  let text
  try {
    text = await readFile(envPath, 'utf8')
  } catch {
    return
  }
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(trimmed)
    if (!match) continue
    const [, key, rawValue] = match
    if (process.env[key] !== undefined) continue
    process.env[key] = unquoteEnvValue(rawValue)
  }
}

function unquoteEnvValue(value) {
  const trimmed = value.trim()
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1)
  }
  return trimmed
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
