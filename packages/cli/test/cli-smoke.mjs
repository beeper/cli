import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { commandManifest } from '../dist/lib/manifest.js'
import { resolveAccountID, resolveAccountIDs, resolveChatID } from '../dist/lib/resolve.js'
import { downloadURLFor, feedURLFor, normalizeInstallRequest } from '../dist/lib/installations.js'

const root = fileURLToPath(new URL('..', import.meta.url))
const configDir = '/tmp/beeper-cli-test'
const run = (...args) => spawnSync(process.execPath, ['./bin/run.js', ...args], {
  cwd: root,
  encoding: 'utf8',
  env: {
    ...process.env,
    BEEPER_CLI_CONFIG_DIR: configDir,
  },
})

const ok = (...args) => {
  const result = run(...args)
  assert.equal(result.status, 0, `${args.join(' ')} failed\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`)
  return result.stdout
}

const expectedCommands = [
  'setup',
  'targets list',
  'targets create desktop',
  'targets create server',
  'targets add remote',
  'targets use',
  'targets show',
  'targets status',
  'targets start',
  'targets stop',
  'targets restart',
  'targets logs',
  'targets enable',
  'targets disable',
  'targets remove',
  'auth status',
  'auth logout',
  'verify',
  'verify status',
  'verify approve',
  'verify recovery-key',
  'verify reset-recovery-key',
  'verify cancel',
  'verify list',
  'verify start',
  'verify show',
  'verify sas',
  'verify sas confirm',
  'verify qr scan',
  'verify qr confirm-scanned',
  'accounts list',
  'accounts add',
  'accounts show',
  'accounts remove',
  'accounts use',
  'chats list',
  'chats search',
  'chats show',
  'chats start',
  'chats archive',
  'chats unarchive',
  'chats pin',
  'chats unpin',
  'chats mute',
  'chats unmute',
  'chats mark-read',
  'chats mark-unread',
  'chats low-priority',
  'chats inbox',
  'chats notify-anyway',
  'chats title',
  'chats description',
  'chats avatar',
  'chats draft',
  'chats clear-draft',
  'chats expiry',
  'chats remind',
  'chats unremind',
  'chats focus',
  'messages list',
  'messages search',
  'messages show',
  'messages context',
  'messages edit',
  'messages delete',
  'messages react',
  'messages unreact',
  'send text',
  'send file',
  'contacts list',
  'contacts search',
  'contacts show',
  'media download',
  'export',
  'watch',
  'rpc',
  'man',
  'doctor',
  'status',
  'docs',
  'version',
  'completion',
  'install desktop',
  'install server',
  'update',
  'config get',
  'config set',
  'config path',
  'config reset',
  'api get',
  'api post',
]

const commandFiles = listCommandFiles(join(root, 'src/commands'))
const commandNames = commandFiles.map(file => fileToCommand(file)).sort()
const manifestNames = commandManifest.map(item => item.command).sort()

assert.deepEqual(commandManifest.map(item => item.command), expectedCommands, 'command manifest must be the nuclear public surface')
assert.deepEqual(manifestNames, commandNames, 'command manifest must match src/commands')
assert.equal(new Set(manifestNames).size, manifestNames.length, 'command manifest must not contain duplicates')

const help = ok('--help')
assert.match(help, /\btargets\b/, 'help should expose targets')
assert.match(help, /\bchats\b/, 'help should expose chats')
assert.match(help, /\bmessages\b/, 'help should expose messages')
assert.doesNotMatch(help, /\bprofile\b|\bcommands\b|\bllm\b|\blogin\b|\blogout\b/, 'help must not expose deleted root/internal commands')
assert.doesNotMatch(help, /\bplugins\b|\bautocomplete\b|\bassets\b|\bapp\b/, 'help must not expose oclif or old API namespaces')

for (const command of expectedCommands) {
  ok(...command.split(' '), '--help')
}

assert.match(ok('send', 'text', '--help'), /--to/, 'send text should use --to')
assert.match(ok('send', 'text', '--help'), /--message/, 'send text should use --message')
assert.match(ok('send', 'file', '--help'), /--file/, 'send file should use --file')
assert.match(ok('send', 'file', '--help'), /--caption/, 'send file should use --caption')
assert.match(ok('messages', 'list', '--help'), /--chat/, 'messages list should use --chat')
assert.match(ok('chats', 'mute', '--help'), /--duration/, 'chats mute should expose duration')
assert.match(ok('chats', 'list', '--help'), /--account=<value>\.\.\./, 'account filters must stay local')
assert.doesNotMatch(ok('status', '--help'), /--account/, '--account must not be global')
const setupHelp = ok('setup', '--help')
assert.match(setupHelp, /--local/, 'setup should expose local Desktop direct setup')
assert.match(setupHelp, /--oauth/, 'setup should expose OAuth setup')
assert.match(setupHelp, /--remote/, 'setup should expose remote setup shortcut')
assert.match(setupHelp, /--server/, 'setup should expose Server setup shortcut')
assert.match(setupHelp, /--desktop/, 'setup should expose Desktop setup shortcut')
assert.doesNotMatch(setupHelp, /--email|--code|--accept-terms/, 'setup must not expose email-code login flags')

const man = JSON.parse(ok('man', '--json'))
assert.equal(man.success, true)
assert.equal(man.error, null)
assert.deepEqual(man.data.map(item => item.command), expectedCommands)

rmSync(configDir, { recursive: true, force: true })
let result = run('targets', 'add', 'remote', 'work', 'http://127.0.0.1:23373', '--default', '--json')
assert.equal(result.status, 0, result.stderr)
let envelope = JSON.parse(result.stdout)
assert.equal(envelope.success, true)
assert.equal(envelope.data.id, 'work')
assert.equal(envelope.data.type, 'remote')

result = run('targets', 'list', '--json')
assert.equal(result.status, 0, result.stderr)
envelope = JSON.parse(result.stdout)
assert.equal(envelope.success, true)
assert(envelope.data.some(item => item.id === 'work' && item.default))

result = run('auth', 'status', '--json')
assert.equal(result.status, 0, result.stderr)
envelope = JSON.parse(result.stdout)
assert.equal(envelope.success, true)
assert.equal(envelope.data.authenticated, false)
assert.equal(envelope.data.target, 'work')

result = run('send', 'text', '--to', 'family', '--message', 'on my way', '--read-only', '--json')
assert.notEqual(result.status, 0)
envelope = JSON.parse(result.stderr)
assert.equal(envelope.success, false)
assert.match(envelope.error, /read-only mode/)

const rpcResult = spawnSync(process.execPath, ['./bin/run.js', 'rpc'], {
  cwd: root,
  encoding: 'utf8',
  env: {
    ...process.env,
    BEEPER_CLI_CONFIG_DIR: configDir,
  },
  input: '{"id":1,"command":"auth status --json"}\n',
})
assert.equal(rpcResult.status, 0, rpcResult.stderr)
const rpcLine = JSON.parse(rpcResult.stdout)
assert.equal(rpcLine.id, 1)
assert.equal(rpcLine.ok, true)
assert.match(rpcLine.stdout, /"success": true/)

const stagingServerRequest = normalizeInstallRequest({ kind: 'server', serverEnv: 'staging', channel: 'stable', platform: 'darwin', arch: 'arm64' })
assert.equal(stagingServerRequest.channel, 'nightly')
assert.equal(stagingServerRequest.bundleID, 'com.automattic.beeper.server.nightly')
assert.equal(feedURLFor(stagingServerRequest), 'https://api.beeper-staging.com/desktop/update-feed.json?bundleID=com.automattic.beeper.server.nightly&platform=darwin&channel=nightly&arch=arm64')
assert.equal(downloadURLFor(stagingServerRequest), 'https://api.beeper-staging.com/desktop/download/macos/arm64/stable/com.automattic.beeper.server.nightly')

const desktopNightlyRequest = normalizeInstallRequest({ kind: 'desktop', channel: 'nightly', platform: 'darwin', arch: 'arm64' })
assert.equal(downloadURLFor(desktopNightlyRequest), 'https://api.beeper.com/desktop/download/macos/arm64/nightly/com.automattic.beeper.desktop.nightly')

const fakeClient = {
  accounts: {
    list: async () => [
      { accountID: 'imessage-main', bridge: { id: 'local-imessage', type: 'imessage' }, network: 'iMessage', user: { displayName: 'Main' } },
      { accountID: 'telegram-main', bridge: { id: 'telegramgo', type: 'telegram' }, network: 'Telegram', user: { displayName: 'Main' } },
    ],
  },
  chats: {
    retrieve: async id => {
      if (id === '!exact:beeper.com' || id === 'local-family') return { id: '!family:beeper.com', localChatID: 'local-family', title: 'Family', network: 'iMessage' }
      throw new Error('not found')
    },
    search: async function* ({ query }) {
      const rows = [
        { id: '!family:beeper.com', localChatID: 'local-family', title: 'Family', network: 'iMessage' },
        { id: '!family-work:beeper.com', localChatID: 'local-family-work', title: 'Family Work', network: 'Telegram' },
      ].filter(chat => chat.title.toLowerCase().includes(String(query).toLowerCase()))
      for (const row of rows) yield row
    },
  },
}

assert.equal(await resolveAccountID(fakeClient, 'imessage'), 'imessage-main')
assert.deepEqual(await resolveAccountIDs(fakeClient, ['main'], { allowMultiplePerInput: true }), ['imessage-main', 'telegram-main'])
await assert.rejects(() => resolveAccountID(fakeClient, 'main'), /Ambiguous account/)
assert.equal(await resolveChatID(fakeClient, '!exact:beeper.com'), '!exact:beeper.com')
assert.equal(await resolveChatID(fakeClient, 'local-family'), 'local-family')
assert.equal(await resolveChatID(fakeClient, 'Family Work'), 'local-family-work')
assert.equal(await resolveChatID(fakeClient, 'fam', { pick: 2 }), 'local-family-work')
await assert.rejects(() => resolveChatID(fakeClient, 'fam'), /Ambiguous chat/)

function listCommandFiles(dir) {
  const output = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      output.push(...listCommandFiles(path))
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      output.push(path)
    }
  }
  return output
}

function fileToCommand(file) {
  const relative = file.slice(join(root, 'src/commands').length + 1)
  const parts = relative.replace(/\.(ts|tsx)$/, '').split('/')
  return parts.map(part => part === 'index' ? undefined : part).filter(Boolean).join(' ')
}

assert(!existsSync(join(root, 'src/commands/profile')), 'profile namespace must be deleted')
assert(!existsSync(join(root, 'src/commands/target')), 'singular target namespace must be deleted')
assert(!existsSync(join(root, 'src/commands/app')), 'app/e2ee namespace must be deleted')
