import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'bun:test'

const cliRoot = fileURLToPath(new URL('..', import.meta.url))
const chatID = '!target:beeper.com'

describe('messages search chat integrity', () => {
  it('avoids the server chatIDs truncation path and filters results client-side', async () => {
    const searchQueries: URLSearchParams[] = []
    const server = Bun.serve({
      port: 0,
      hostname: '127.0.0.1',
      fetch(request) {
        const url = new URL(request.url)
        const path = decodeURIComponent(url.pathname)

        if (path === `/v1/chats/${chatID}`) {
          return Response.json({
            id: chatID,
            accountID: 'account-1',
            network: 'WhatsApp',
            participants: { hasMore: false, items: [], total: 0 },
            title: 'Target',
            type: 'single',
            unreadCount: 0,
          })
        }

        if (path === '/v1/messages/search') {
          searchQueries.push(url.searchParams)
          return Response.json({
            items: [
              {
                id: 'target-1',
                accountID: 'account-1',
                chatID,
                senderID: 'alice',
                sortKey: '3',
                timestamp: '2026-01-03T00:00:00Z',
                text: 'invoice one',
              },
              {
                id: 'other-1',
                accountID: 'account-1',
                chatID: '!other:beeper.com',
                senderID: 'bob',
                sortKey: '2',
                timestamp: '2026-01-02T00:00:00Z',
                text: 'invoice elsewhere',
              },
              {
                id: 'target-2',
                accountID: 'account-1',
                chatID,
                senderID: 'alice',
                sortKey: '1',
                timestamp: '2026-01-01T00:00:00Z',
                text: 'invoice two',
              },
            ],
            hasMore: false,
            oldestCursor: null,
            newestCursor: null,
          })
        }

        return Response.json({ message: 'not found' }, { status: 404 })
      },
    })

    try {
      const child = Bun.spawn([
        process.execPath,
        './bin/dev.js',
        'messages',
        'search',
        'invoice',
        '--chat',
        chatID,
        '--limit',
        '10',
        '--base-url',
        server.url.origin,
        '--json',
      ], {
        cwd: cliRoot,
        env: {
          ...process.env,
          BEEPER_ACCESS_TOKEN: 'test-token',
          BEEPER_CLI_CONFIG_DIR: '/tmp/beeper-cli-bun-test',
          BEEPER_NO_LOGO: '1',
        },
        stdout: 'pipe',
        stderr: 'pipe',
      })

      expect(await child.exited).toBe(0)
      const stdout = await new Response(child.stdout).text()
      const envelope = JSON.parse(stdout)
      expect(envelope.data.map((item: { id: string }) => item.id)).toEqual(['target-1', 'target-2'])

      expect(searchQueries).toHaveLength(1)
      const query = searchQueries[0]!
      expect(query.has('chatIDs')).toBe(false)
      expect(query.getAll('accountIDs')).toContain('account-1')
      expect(query.get('query')).toBe('invoice')
    } finally {
      server.stop(true)
    }
  }, 20_000)
})
