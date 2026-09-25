import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'bun:test'

const cliRoot = fileURLToPath(new URL('..', import.meta.url))
const chatID = '!archive-test:beeper.com'

describe('chats archive', () => {
  it('archives and unarchives through the archive endpoint', async () => {
    const requests: Array<{ method: string; path: string; body: unknown }> = []
    const server = Bun.serve({
      port: 0,
      hostname: '127.0.0.1',
      async fetch(request) {
        const text = await request.text()
        requests.push({ method: request.method, path: decodeURIComponent(new URL(request.url).pathname), body: text ? JSON.parse(text) : undefined })
        return new Response(null, { status: 200 })
      },
    })

    try {
      for (const command of ['archive', 'unarchive']) {
        const child = Bun.spawn([process.execPath, './bin/dev.js', 'chats', command, '--chat', chatID, '--base-url', server.url.origin, '--json'], {
          cwd: cliRoot,
          env: { ...process.env, BEEPER_ACCESS_TOKEN: 'test-token', BEEPER_CLI_CONFIG_DIR: '/tmp/beeper-cli-bun-test', BEEPER_NO_LOGO: '1' },
          stdout: 'pipe',
          stderr: 'pipe',
        })
        expect(await child.exited).toBe(0)
      }

      expect(requests).toEqual([
        { method: 'POST', path: `/v1/chats/${chatID}/archive`, body: { archived: true } },
        { method: 'POST', path: `/v1/chats/${chatID}/archive`, body: { archived: false } },
      ])
    } finally {
      server.stop(true)
    }
  }, 20_000)
})
