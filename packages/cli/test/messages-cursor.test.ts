import { fileURLToPath } from 'node:url'
import { describe, expect, it, mock } from 'bun:test'
import { resolveMessageCursor } from '../src/lib/resolve.js'

const cliRoot = fileURLToPath(new URL('..', import.meta.url))
const cliEnv = { ...process.env, BEEPER_ACCESS_TOKEN: 'test-token', BEEPER_CLI_CONFIG_DIR: '/tmp/beeper-cli-bun-test', BEEPER_NO_LOGO: '1' }

describe('resolveMessageCursor', () => {
  const chatID = '!chat:beeper.com'

  it('resolves a message ID to its sortKey', async () => {
    const retrieve = mock(async (id: string, params: { chatID: string }) => {
      expect(id).toBe('1343993')
      expect(params.chatID).toBe(chatID)
      return { id: '1343993', chatID, sortKey: '821744079' }
    })
    const client = { messages: { retrieve } }
    await expect(resolveMessageCursor(client, chatID, '1343993')).resolves.toBe('821744079')
    expect(retrieve).toHaveBeenCalledTimes(1)
  })

  it('passes through an already-resolved sortKey when retrieve 404s', async () => {
    const retrieve = mock(async () => {
      throw new Error('Message not found (404)')
    })
    const client = { messages: { retrieve } }
    await expect(resolveMessageCursor(client, chatID, '821744079')).resolves.toBe('821744079')
  })

  it('returns undefined when no cursor is provided', async () => {
    const retrieve = mock(async () => ({ id: 'x', sortKey: 'y' }))
    const client = { messages: { retrieve } }
    await expect(resolveMessageCursor(client, chatID, undefined)).resolves.toBeUndefined()
    expect(retrieve).toHaveBeenCalledTimes(0)
  })

  it('passes through when retrieve is unavailable', async () => {
    const client = { messages: {} }
    await expect(resolveMessageCursor(client, chatID, '1343993')).resolves.toBe('1343993')
  })

  it('passes through when retrieve succeeds but sortKey is missing', async () => {
    const retrieve = mock(async () => ({ id: '1343993', chatID }))
    const client = { messages: { retrieve } }
    await expect(resolveMessageCursor(client, chatID, '1343993')).resolves.toBe('1343993')
  })

  it('rethrows unexpected retrieve errors', async () => {
    const retrieve = mock(async () => {
      throw new Error('network down')
    })
    const client = { messages: { retrieve } }
    await expect(resolveMessageCursor(client, chatID, '1343993')).rejects.toThrow('network down')
  })
})

describe('messages list + context cursor wiring', () => {
  it('list command sends the resolved sortKey as the API cursor', async () => {
    const chatID = '!c:beeper.com'
    const requests: Array<{ path: string; cursor: string | null; direction: string | null }> = []
    const server = Bun.serve({
      port: 0,
      hostname: '127.0.0.1',
      fetch(request) {
        const url = new URL(request.url)
        const path = decodeURIComponent(url.pathname)
        if (path === `/v1/chats/${chatID}/messages/msg-1`) {
          return Response.json({ id: 'msg-1', chatID, accountID: 'a', senderID: 's', timestamp: '2026-01-01T00:00:00Z', sortKey: 'sort-from-id' })
        }
        if (path === `/v1/chats/${chatID}/messages`) {
          requests.push({ path, cursor: url.searchParams.get('cursor'), direction: url.searchParams.get('direction') })
          return Response.json({ items: [], hasMore: false, oldestCursor: null, newestCursor: null })
        }
        return Response.json({ message: 'not found', code: 'not_found' }, { status: 404 })
      },
    })

    try {
      const child = Bun.spawn([process.execPath, './bin/dev.js', 'messages', 'list', '--chat', chatID, '--before-cursor', 'msg-1', '--base-url', server.url.origin, '--json'], {
        cwd: cliRoot,
        env: cliEnv,
        stdout: 'pipe',
        stderr: 'pipe',
      })
      expect(await child.exited).toBe(0)
      expect(requests).toEqual([{ path: `/v1/chats/${chatID}/messages`, cursor: 'sort-from-id', direction: 'before' }])
    } finally {
      server.stop(true)
    }
  }, 20_000)

  it('context command resolves once and uses the same sortKey for before and after', async () => {
    const chatID = '!c:beeper.com'
    let retrieveCount = 0
    const requests: Array<{ cursor: string | null; direction: string | null }> = []
    const server = Bun.serve({
      port: 0,
      hostname: '127.0.0.1',
      fetch(request) {
        const url = new URL(request.url)
        const path = decodeURIComponent(url.pathname)
        if (path === `/v1/chats/${chatID}/messages/target-id`) {
          retrieveCount += 1
          return Response.json({ id: 'target-id', chatID, accountID: 'a', senderID: 's', timestamp: '2026-01-01T00:00:00Z', sortKey: 'sk-99' })
        }
        if (path === `/v1/chats/${chatID}/messages`) {
          requests.push({ cursor: url.searchParams.get('cursor'), direction: url.searchParams.get('direction') })
          return Response.json({ items: [], hasMore: false, oldestCursor: null, newestCursor: null })
        }
        return Response.json({ message: 'not found', code: 'not_found' }, { status: 404 })
      },
    })

    try {
      const child = Bun.spawn([process.execPath, './bin/dev.js', 'messages', 'context', '--chat', chatID, '--id', 'target-id', '--before', '1', '--after', '1', '--base-url', server.url.origin, '--json'], {
        cwd: cliRoot,
        env: cliEnv,
        stdout: 'pipe',
        stderr: 'pipe',
      })
      expect(await child.exited).toBe(0)
      expect(retrieveCount).toBe(1)
      expect(requests).toEqual([
        { cursor: 'sk-99', direction: 'before' },
        { cursor: 'sk-99', direction: 'after' },
      ])
    } finally {
      server.stop(true)
    }
  }, 20_000)
})
