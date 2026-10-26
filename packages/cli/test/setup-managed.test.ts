import { chmod, mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'bun:test'

const cliRoot = fileURLToPath(new URL('..', import.meta.url))

describe('managed setup launch failures', () => {
  for (const json of [false, true]) {
    it(`warns and checks Desktop readiness with json=${json}`, async () => {
      const result = await runSetup('desktop', json)
      expect(result.code).toBe(0)
      expect(result.stderr).toContain('Could not launch Beeper Desktop: test launch failed')
      if (json) {
        const output = JSON.parse(result.stdout)
        expect(output.success).toBe(true)
        expect(output.data.readiness.state).toBe('target-unreachable')
        expect(output.data.readiness.message).toContain('test target unavailable')
      } else {
        expect(result.stdout).toContain('target unreachable')
        expect(result.stdout).toContain('test target unavailable')
      }
    }, 20_000)
  }

  it('still fails when Server cannot launch', async () => {
    const result = await runSetup('server', true)
    expect(result.code).not.toBe(0)
    expect(JSON.parse(result.stderr).error).toBe('test launch failed')
    expect(result.stdout).toBe('')
  }, 20_000)
})

async function runSetup(type: 'desktop' | 'server', json: boolean) {
  const tempDir = await mkdtemp(join(tmpdir(), 'beeper-setup-managed-'))
  const server = Bun.serve({
    port: 0,
    hostname: '127.0.0.1',
    fetch: () => new Response('test target unavailable', { status: 503 }),
  })
  try {
    const configDir = join(tempDir, 'config')
    await mkdir(join(configDir, 'targets'), { recursive: true })
    await writeFile(join(configDir, 'targets', 'test.json'), JSON.stringify({
      id: 'test', type, managed: true, baseURL: server.url.origin, dataDir: join(tempDir, 'profile'),
    }))
    const preload = join(tempDir, 'mock-launch.ts')
    const profilesURL = new URL('../dist/lib/profiles.js', import.meta.url).href
    await writeFile(preload, `import { mock } from 'bun:test'
import * as profiles from ${JSON.stringify(profilesURL)}
mock.module(${JSON.stringify(profilesURL)}, () => ({
  ...profiles,
  startProfile: async () => { throw new Error('test launch failed') },
}))
const { default: Setup } = await import(${JSON.stringify(new URL('../dist/commands/setup.js', import.meta.url).href)})
await Setup.run(process.argv.slice(2), ${JSON.stringify(cliRoot)})
`)
    // A missed mock must never reach the system Desktop opener.
    const binDir = join(tempDir, 'bin')
    await mkdir(binDir)
    await writeFile(join(binDir, 'open'), '#!/bin/sh\nexit 1\n')
    await chmod(join(binDir, 'open'), 0o755)
    const child = Bun.spawn([
      process.execPath, preload, `--${type}`, '--target', 'test',
      ...(json ? ['--json'] : []),
    ], {
      cwd: cliRoot,
      env: { ...process.env, PATH: binDir, BEEPER_READONLY: '0', BEEPER_CLI_CONFIG_DIR: configDir, BEEPER_NO_LOGO: '1' },
      stdout: 'pipe',
      stderr: 'pipe',
    })
    const [code, stdout, stderr] = await Promise.all([
      child.exited, new Response(child.stdout).text(), new Response(child.stderr).text(),
    ])
    return { code, stdout, stderr }
  } finally {
    server.stop(true)
    await rm(tempDir, { recursive: true, force: true })
  }
}
