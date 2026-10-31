import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { delimiter, dirname, join } from 'node:path'
import { describe, expect, it } from 'bun:test'

const cliRoot = join(import.meta.dir, '..')

describe.if(process.platform !== 'win32')('target OAuth persistence', () => {
  it('keeps the remote setup token and reuses it in later commands', async () => {
    const fixture = await createFixture()
    try {
      const output = await fixture.cli('setup', '--remote', fixture.baseURL, '--yes', '--json')
      const id = JSON.parse(output).data.target.id
      const target = await fixture.target(id)
      expect(target.auth).toMatchObject({ accessToken: 'test-token', clientID: 'test-client', source: 'remote-oauth' })
      expect((await fixture.config()).defaultTarget).toBe(id)

      await fixture.cli('api', 'get', '/v1/info')
      await fixture.cli('api', 'get', '/v1/info')
      expect(fixture.registrations()).toBe(1)
      expect(fixture.authorizations).toEqual(['Bearer test-token', 'Bearer test-token'])
      expect((await fixture.config()).auth).toBeUndefined()
    } finally {
      await fixture.close()
    }
  }, 20_000)

  for (const type of ['remote', 'server'] as const) {
    for (const caller of ['createClient', 'requireToken'] as const) {
      it(`saves ${caller}'s fallback token on a ${type} target for the next process`, async () => {
        const fixture = await createFixture()
        const desktopAuth = { accessToken: 'desktop-token', tokenType: 'Bearer' }
        try {
          await fixture.seed({ id: 'work', type, baseURL: fixture.baseURL }, {
            defaultTarget: 'work', baseURL: 'http://127.0.0.1:1', auth: desktopAuth,
          })
          for (let attempt = 0; attempt < 2; attempt++) {
            if (caller === 'createClient') await fixture.cli('api', 'get', '/v1/info', '--target', 'work')
            else expect(await fixture.run('-e', "import { requireToken } from './src/lib/client.ts'; console.log(await requireToken({ target: 'work', scan: false }))")).toBe('test-token\n')
          }
          expect(fixture.registrations()).toBe(1)
          expect((await fixture.target('work')).auth).toMatchObject({
            accessToken: 'test-token', clientID: 'test-client', tokenType: 'Bearer', scope: 'read write',
          })
          expect((await fixture.config()).auth).toEqual(desktopAuth)
          if (caller === 'createClient') expect(fixture.authorizations).toEqual(['Bearer test-token', 'Bearer test-token'])
        } finally {
          await fixture.close()
        }
      }, 20_000)
    }
  }

  for (const managed of [false, true]) {
    it(`keeps config auth persistence for ${managed ? 'managed' : 'built-in'} Desktop`, async () => {
      const fixture = await createFixture()
      try {
        await fixture.seed({ id: 'desktop', type: 'desktop', baseURL: fixture.baseURL, managed }, { defaultTarget: 'desktop' })
        await fixture.cli('api', 'get', '/v1/info')
        await fixture.cli('api', 'get', '/v1/info')
        expect(fixture.registrations()).toBe(1)
        expect((await fixture.target('desktop')).auth).toBeUndefined()
        expect((await fixture.config()).auth).toMatchObject({ accessToken: 'test-token', source: 'desktop-oauth' })
        expect(fixture.authorizations).toEqual(['Bearer test-token', 'Bearer test-token'])
      } finally {
        await fixture.close()
      }
    }, 20_000)
  }
})

async function createFixture() {
  const configDir = await mkdtemp(join(tmpdir(), 'beeper-cli-oauth-'))
  const binDir = join(configDir, 'bin')
  await mkdir(binDir)
  // Complete browser OAuth against the mock server without opening a real browser.
  for (const command of ['open', 'xdg-open']) {
    await writeFile(join(binDir, command), '#!/usr/bin/env bun\nawait fetch(process.argv[2])\n', { mode: 0o755 })
  }
  let registrations = 0
  const authorizations: string[] = []
  const server = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    fetch(request) {
      const url = new URL(request.url)
      if (url.pathname === '/oauth/register') {
        registrations++
        return Response.json({ client_id: 'test-client' })
      }
      if (url.pathname === '/oauth/authorize') {
        const redirect = new URL(url.searchParams.get('redirect_uri')!)
        redirect.searchParams.set('code', 'test-code')
        redirect.searchParams.set('state', url.searchParams.get('state')!)
        return Response.redirect(redirect.href)
      }
      if (url.pathname === '/oauth/token') {
        return Response.json({ access_token: 'test-token', token_type: 'Bearer', expires_in: 3600, scope: 'read write' })
      }
      if (url.pathname === '/v1/app/setup') return Response.json({ state: 'ready' })
      if (url.pathname === '/v1/accounts') return Response.json([])
      if (url.pathname === '/v1/info') {
        const authorization = request.headers.get('authorization')
        if (authorization) authorizations.push(authorization)
        return Response.json({ ok: true })
      }
      return new Response(null, { status: 404 })
    },
  })
  const env = {
    ...process.env,
    PATH: [binDir, dirname(process.execPath), process.env.PATH].join(delimiter),
    BEEPER_CLI_CONFIG_DIR: configDir,
    BEEPER_READONLY: '0',
    BEEPER_NO_LOGO: '1',
  }
  delete env.BEEPER_ACCESS_TOKEN
  delete env.BEEPER_TARGET
  delete env.BEEPER_DESKTOP_BASE_URL

  async function run(...args: string[]) {
    const child = Bun.spawn([process.execPath, ...args], { cwd: cliRoot, env, stdout: 'pipe', stderr: 'pipe' })
    const timeout = setTimeout(() => child.kill(), 18_000)
    try {
      const [stdout, stderr, code] = await Promise.all([
        new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited,
      ])
      expect({ code, stderr }).toEqual({ code: 0, stderr: '' })
      return stdout
    } finally {
      clearTimeout(timeout)
    }
  }

  return {
    baseURL: server.url.origin,
    authorizations,
    registrations: () => registrations,
    run,
    cli: (...args: string[]) => run('./bin/dev.js', ...args),
    target: async (id: string) => JSON.parse(await readFile(join(configDir, 'targets', `${id}.json`), 'utf8')),
    config: async () => JSON.parse(await readFile(join(configDir, 'config.json'), 'utf8')),
    seed: async (target: Record<string, unknown>, config: Record<string, unknown>) => {
      await mkdir(join(configDir, 'targets'), { recursive: true })
      await writeFile(join(configDir, 'targets', `${target.id}.json`), JSON.stringify(target))
      await writeFile(join(configDir, 'config.json'), JSON.stringify(config))
    },
    close: async () => {
      server.stop(true)
      await rm(configDir, { recursive: true, force: true })
    },
  }
}
