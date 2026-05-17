import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { join, relative } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { commandManifest } from '../dist/lib/manifest.js'
import { exportBeeperData } from '../dist/lib/export/index.js'
import { ensureDesktopToken, findLocalDesktop } from '../dist/lib/desktop-auth.js'
import { resolveAccountID, resolveAccountIDs, resolveChatID } from '../dist/lib/resolve.js'

const root = fileURLToPath(new URL('..', import.meta.url))
const run = (...args) => spawnSync(process.execPath, ['./bin/run.js', ...args], {
  cwd: root,
  encoding: 'utf8',
  env: {
    ...process.env,
    BEEPER_CLI_CONFIG_DIR: '/tmp/beeper-cli-test',
  },
})

const ok = (...args) => {
  const result = run(...args)
  assert.equal(result.status, 0, `${args.join(' ')} failed\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`)
  return result.stdout
}

const commandFiles = listCommandFiles(join(root, 'src/commands'))
const commandNames = commandFiles.map(file => fileToCommand(file)).sort()
const manifestNames = commandManifest.map(item => item.command).sort()

assert.deepEqual(manifestNames, commandNames, 'command manifest must match src/commands')
assert.equal(new Set(manifestNames).size, manifestNames.length, 'command manifest must not contain duplicates')

const help = ok('--help')
assert.match(help, /\bchat\b/, 'help should expose canonical chat command')
assert.match(help, /\bchats\b/, 'help should expose canonical chats command')
assert.doesNotMatch(help, /\bthread\b|\bthreads\b|\btail\b|\bwhoami\b/, 'help must not expose compatibility aliases')
assert.doesNotMatch(help, /\bfailed-sends\b|\bscheduled\b|\blocal\s+stats\b/, 'help must not expose stale local DB commands')

for (const command of [
  ['chat', '--help'],
  ['chats', '--help'],
  ['send', 'text', '--help'],
  ['send', 'file', '--help'],
  ['watch', '--help'],
  ['current-user', '--help'],
  ['export', '--help'],
  ['contacts', 'list', '--help'],
  ['pin', '--help'],
  ['unpin', '--help'],
  ['low-priority', '--help'],
  ['inbox', '--help'],
  ['title', '--help'],
  ['description', '--help'],
  ['avatar', '--help'],
  ['message-expiry', '--help'],
  ['login', '--help'],
  ['logout', '--help'],
  ['config', 'get', '--help'],
  ['config', 'set', '--help'],
  ['config', 'reset', '--help'],
  ['llm'],
]) {
  ok(...command)
}

assert.match(ok('send', 'text', '--help'), /--pick/, 'send text should expose --pick for ambiguous chat names')
assert.match(ok('send', 'text', '--help'), /--wait/, 'send text should expose --wait')
assert.match(ok('messages', '--help'), /--pick/, 'messages should expose --pick for ambiguous chat names')
assert.match(ok('chats', '--help'), /--account=<value>\.\.\./, 'chats should accept account selectors')
assert.match(ok('export', '--help'), /--out/, 'export should expose output directory selection')
assert.match(ok('export', '--help'), /--no-attachments/, 'export should expose attachment control')
assert.match(ok('login', '--help'), /--server-url/, 'login should expose --server-url')

const commandsJSON = JSON.parse(ok('commands', '--json'))
assert.equal(commandsJSON.length, commandManifest.length, 'commands --json should expose the full manifest')
assert(commandsJSON.some(item => item.command === 'chat'), 'commands --json should include canonical chat command')
assert(commandsJSON.some(item => item.command === 'send text'), 'commands --json should include send text')
assert(commandsJSON.some(item => item.command === 'send file'), 'commands --json should include send file')
assert(!commandsJSON.some(item => ['thread', 'threads', 'tail', 'whoami'].includes(item.command)), 'commands --json must not include compatibility aliases')
assert(!commandsJSON.some(item => item.command === 'serve'), 'commands --json must not include serve')
assert(!commandsJSON.some(item => item.command.includes('base64')), 'commands --json must not include base64 asset variants')

const configDir = '/tmp/beeper-cli-test-config'
rmSync(configDir, { recursive: true, force: true })
const configEnv = { ...process.env, BEEPER_CLI_CONFIG_DIR: configDir }
let config = spawnSync(process.execPath, ['./bin/run.js', 'target', 'add', 'local', 'http://127.0.0.1:23373', '--default'], {
  cwd: root,
  encoding: 'utf8',
  env: configEnv,
})
assert.equal(config.status, 0, config.stderr)
config = spawnSync(process.execPath, ['./bin/run.js', 'target', 'info', '--json'], {
  cwd: root,
  encoding: 'utf8',
  env: configEnv,
})
assert.equal(config.status, 0, config.stderr)
assert.match(config.stdout, /127\.0\.0\.1:23373/)
config = spawnSync(process.execPath, ['./bin/run.js', 'config', 'reset'], {
  cwd: root,
  encoding: 'utf8',
  env: configEnv,
})
assert.equal(config.status, 0, config.stderr)

const rpc = spawnSync('printf', ['%s\n', '{"id":1,"command":"auth status --json"}'], {
  encoding: 'utf8',
  cwd: root,
})
assert.equal(rpc.status, 0, rpc.stderr)
const rpcResult = spawnSync(process.execPath, ['./bin/run.js', 'rpc'], {
  cwd: root,
  encoding: 'utf8',
  env: {
    ...process.env,
    BEEPER_CLI_CONFIG_DIR: '/tmp/beeper-cli-test',
  },
  input: rpc.stdout,
})
assert.equal(rpcResult.status, 0, rpcResult.stderr)
const rpcLine = JSON.parse(rpcResult.stdout)
assert.equal(rpcLine.id, 1)
assert.equal(rpcLine.ok, true)
assert.match(rpcLine.stdout, /"authenticated": false/)

const shell = spawnSync(process.execPath, ['./bin/run.js', 'shell'], {
  cwd: root,
  encoding: 'utf8',
  env: {
    ...process.env,
    BEEPER_CLI_CONFIG_DIR: '/tmp/beeper-cli-test',
  },
  input: 'auth status --json\nquit\n',
})
assert.equal(shell.status, 0, shell.stderr)
assert.match(shell.stdout, /"authenticated": false/)

const accountsOutput = await withMockAPI(async baseURL => {
  const result = await runAsync(['./bin/run.js', 'accounts', '--base-url', baseURL], {
    cwd: root,
    env: {
      ...process.env,
      BEEPER_ACCESS_TOKEN: 'bdapi_test',
      BEEPER_CLI_CONFIG_DIR: '/tmp/beeper-cli-accounts-test',
    },
  })
  assert.equal(result.status, 0, result.stderr)
  return result.stdout
})
assert.match(accountsOutput, /iMessage/)
assert.doesNotMatch(accountsOutput, /No accounts connected/)

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
assert.equal(await resolveChatID(fakeClient, 'local-family'), '!family:beeper.com')
assert.equal(await resolveChatID(fakeClient, 'Family Work'), '!family-work:beeper.com')
assert.equal(await resolveChatID(fakeClient, 'fam', { pick: 2 }), '!family-work:beeper.com')
await assert.rejects(() => resolveChatID(fakeClient, 'fam'), /Ambiguous chat/)

const loggedOutDesktop = await withMockDesktop({ state: 'needs-login' }, async baseURL => {
  const desktop = await findLocalDesktop({ baseURL })
  assert.equal(desktop.baseURL, baseURL)
  assert.equal(desktop.status?.state, 'needs-login')
  await assert.rejects(
    () => ensureDesktopToken({ baseURL, openBrowser: false }),
    /Beeper Desktop is not signed in/,
  )
  return true
})
assert.equal(loggedOutDesktop, true)

const exportRoot = mkdtempSync(join(tmpdir(), 'beeper-export-test-'))
const attachmentSource = join(exportRoot, 'source.txt')
writeFileSync(attachmentSource, 'hello attachment')
let messageListCalls = 0
const exportClient = {
  accounts: {
    list: async () => [
      { accountID: 'imessage-main', bridge: { id: 'local-imessage', type: 'imessage' }, network: 'iMessage', user: { id: 'me', fullName: 'Me' } },
    ],
  },
  chats: {
    list: async function* () {
      yield { id: '!family:beeper.com', accountID: 'imessage-main', network: 'iMessage', title: 'Family', type: 'group', participants: { hasMore: false, items: [], total: 0 }, unreadCount: 0 }
    },
    retrieve: async () => ({ id: '!family:beeper.com', accountID: 'imessage-main', network: 'iMessage', title: 'Family', type: 'group', participants: { hasMore: false, items: [], total: 0 }, unreadCount: 0 }),
  },
  messages: {
    list: async (_chatID, query) => {
      messageListCalls += 1
      if (query?.cursor === 'older') {
        return { items: [messageOne], hasMore: false, oldestCursor: null }
      }
      return { items: [messageTwo], hasMore: true, oldestCursor: 'older' }
    },
  },
}
const messageOne = {
  id: 'm1',
  accountID: 'imessage-main',
  chatID: '!family:beeper.com',
  senderID: '@alice:example',
  senderName: 'Alice',
  sortKey: '1',
  timestamp: '2026-05-13T10:00:00Z',
  text: 'first',
  attachments: [{ type: 'unknown', id: `file://${attachmentSource}`, fileName: 'source.txt', mimeType: 'text/plain' }],
}
const messageTwo = {
  id: 'm2',
  accountID: 'imessage-main',
  chatID: '!family:beeper.com',
  senderID: '@me:example',
  senderName: 'Me',
  sortKey: '2',
  timestamp: '2026-05-13T10:01:00Z',
  text: 'second',
}

const manifest = await exportBeeperData(exportClient, {
  downloadAttachments: true,
  force: false,
  outDir: exportRoot,
  quiet: true,
})
assert.equal(manifest.chatCount, 1)
assert.equal(manifest.messageCount, 2)
assert.equal(manifest.attachmentCount, 1)
const exportedChatDir = join(exportRoot, 'chats', 'family_beeper.com')
assert.deepEqual(JSON.parse(readFileSync(join(exportRoot, 'accounts.json'), 'utf8'))[0].accountID, 'imessage-main')
assert.equal(JSON.parse(readFileSync(join(exportedChatDir, 'messages.json'), 'utf8')).length, 2)
assert.match(readFileSync(join(exportedChatDir, 'messages.markdown'), 'utf8'), /Alice[\s\S]*first[\s\S]*source\.txt/)
assert.match(readFileSync(join(exportedChatDir, 'messages.html'), 'utf8'), /<title>Family<\/title>[\s\S]*Alice[\s\S]*first[\s\S]*source\.txt/)
assert.equal(readFileSync(join(exportedChatDir, 'attachments', 'm1', '01-source.txt'), 'utf8'), 'hello attachment')
assert(!existsSync(join(exportedChatDir, 'messages.partial.jsonl')), 'completed exports should remove partial checkpoint streams')
const callsAfterFirstExport = messageListCalls
await exportBeeperData(exportClient, {
  downloadAttachments: true,
  force: false,
  outDir: exportRoot,
  quiet: true,
})
assert.equal(messageListCalls, callsAfterFirstExport, 'completed chats should be skipped on resumable rerun')
rmSync(exportRoot, { recursive: true, force: true })

console.log(`cli-smoke: ${commandManifest.length} commands verified`)

function listCommandFiles(dir) {
  const files = []
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) {
      files.push(...listCommandFiles(path))
    } else if (path.endsWith('.ts') || path.endsWith('.tsx')) {
      files.push(path)
    }
  }
  return files
}

function fileToCommand(file) {
  const rel = relative(join(root, 'src/commands'), file).replace(/\.tsx?$/, '')
  return rel.endsWith('/index')
    ? rel.slice(0, -'/index'.length).replaceAll('/', ' ')
    : rel.replaceAll('/', ' ')
}

function withMockDesktop(appStatus, callback) {
  const server = createServer((req, res) => {
    if (req.url === '/v1/info') {
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ ok: true }))
      return
    }
    if (req.url === '/v1/app/setup') {
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify(appStatus))
      return
    }
    res.writeHead(404).end('Not found')
  })

  return new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', async () => {
      const address = server.address()
      try {
        const result = await callback(`http://127.0.0.1:${address.port}`)
        server.close(() => resolve(result))
      } catch (error) {
        server.close(() => reject(error))
      }
    })
  })
}

function withMockAPI(callback) {
  const server = createServer((req, res) => {
    if (req.url === '/v1/accounts') {
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify([
        { accountID: 'imessage-main', bridge: { id: 'local-imessage', type: 'imessage' }, network: 'iMessage', user: { displayName: 'Main' } },
      ]))
      return
    }
    res.writeHead(404).end('Not found')
  })

  return new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', async () => {
      const address = server.address()
      try {
        const result = await callback(`http://127.0.0.1:${address.port}`)
        server.close(() => resolve(result))
      } catch (error) {
        server.close(() => reject(error))
      }
    })
  })
}

function runAsync(args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      ...options,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', chunk => { stdout += chunk })
    child.stderr.on('data', chunk => { stderr += chunk })
    child.on('error', reject)
    child.on('close', status => resolve({ status, stdout, stderr }))
  })
}
