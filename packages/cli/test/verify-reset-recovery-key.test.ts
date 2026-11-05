import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'bun:test'

const cliRoot = fileURLToPath(new URL('..', import.meta.url))

describe('verify reset-recovery-key', () => {
  it('refuses without --yes before touching the account, and says accounts will be disconnected', async () => {
    const requests: string[] = []
    const server = Bun.serve({
      port: 0,
      hostname: '127.0.0.1',
      fetch(request) {
        requests.push(`${request.method} ${new URL(request.url).pathname}`)
        return Response.json({})
      },
    })

    try {
      const child = Bun.spawn([process.execPath, './bin/dev.js', 'verify', 'reset-recovery-key', '--base-url', server.url.origin, '--json'], {
        cwd: cliRoot,
        env: { ...process.env, BEEPER_ACCESS_TOKEN: 'test-token', BEEPER_CLI_CONFIG_DIR: '/tmp/beeper-cli-bun-test', BEEPER_NO_LOGO: '1' },
        stdin: 'ignore',
        stdout: 'pipe',
        stderr: 'pipe',
      })
      const output = await new Response(child.stdout).text() + await new Response(child.stderr).text()

      expect(await child.exited).not.toBe(0)
      expect(output).toContain('signs out every chat account')
      expect(requests).toEqual([])
    } finally {
      server.stop(true)
    }
  }, 20_000)
})
