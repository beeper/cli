import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'bun:test'

const cliRoot = fileURLToPath(new URL('..', import.meta.url))

describe('chats search labels', () => {
  it('resolves a label name and sends labelID + unreadOnly to chat search', async () => {
    const requests: Array<{ path: string; query: Record<string, string> }> = []
    const server = Bun.serve({
      port: 0,
      hostname: '127.0.0.1',
      fetch(request) {
        const url = new URL(request.url)
        const path = decodeURIComponent(url.pathname)
        requests.push({
          path,
          query: Object.fromEntries(url.searchParams.entries()),
        })

        if (path === '/v1/labels') {
          return Response.json([
            { id: 'label-work', name: 'Work' },
            { id: 'label-customers', name: 'Customers' },
          ])
        }
        if (path === '/v1/chats/search') {
          return Response.json({
            items: [{
              id: '!work:beeper.com',
              accountID: 'matrix',
              network: 'Beeper',
              participants: { hasMore: false, items: [], total: 0 },
              title: 'Work',
              type: 'group',
              unreadCount: 2,
            }],
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
        'chats',
        'search',
        '--label',
        'Work',
        '--unread',
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

      const labelRequest = requests.find(item => item.path === '/v1/labels')
      expect(labelRequest).toBeDefined()
      const searchRequest = requests.find(item => item.path === '/v1/chats/search')
      expect(searchRequest).toBeDefined()
      expect(searchRequest?.query.labelID).toBe('label-work')
      expect(searchRequest?.query.unreadOnly).toBe('true')
      expect(searchRequest?.query.query).toBeUndefined()
    } finally {
      server.stop(true)
    }
  }, 20_000)
})
