import { afterEach, describe, expect, it } from 'bun:test'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { BeeperDesktop } from '@beeper/desktop-api'
import { finishEmailSetup, startEmailSetup } from '../src/lib/setup-login.js'
import type { Target } from '../src/lib/targets.js'

const require = createRequire(import.meta.url)
const previousConfigDir = process.env.BEEPER_CLI_CONFIG_DIR

const matrix = {
  accessToken: 'matrix-token',
  deviceID: 'DEVICE',
  homeserver: 'https://beeper.example',
  userID: '@person:beeper.com',
}

describe('headless email setup', () => {
  let server: ReturnType<typeof Bun.serve> | undefined
  let configDir: string | undefined

  afterEach(async () => {
    if (server) await server.stop(true)
    server = undefined
    if (configDir) await rm(configDir, { recursive: true, force: true })
    configDir = undefined

    if (previousConfigDir === undefined) delete process.env.BEEPER_CLI_CONFIG_DIR
    else process.env.BEEPER_CLI_CONFIG_DIR = previousConfigDir
  })

  it('uses the desktop-api app.setup resource that replaced app.login', async () => {
    const packageJson = JSON.parse(await readFile(require.resolve('@beeper/desktop-api/package.json'), 'utf8')) as { version: string }
    expect(packageJson.version).toBe('6.0.0')

    const client = new BeeperDesktop({ baseURL: 'http://127.0.0.1:9', accessToken: 'test', logLevel: 'warn' })
    const app = client.app as { login?: unknown; setup?: Record<string, unknown> }
    const setup = app.setup ?? {}
    const recoveryKey = record(setup.recoveryKey)
    const reset = record(recoveryKey.reset)
    const verifications = record(setup.verifications)
    const sas = record(verifications.sas)
    const qr = record(verifications.qr)

    expect(app.login).toBeUndefined()
    expect(typeof setup.start).toBe('function')
    expect(typeof setup.email).toBe('function')
    expect(typeof setup.response).toBe('function')
    expect(typeof setup.register).toBe('function')
    expect(typeof recoveryKey.verify).toBe('function')
    expect(typeof reset.create).toBe('function')
    expect(typeof reset.confirm).toBe('function')
    expect(typeof verifications.list).toBe('function')
    expect(typeof verifications.accept).toBe('function')
    expect(typeof sas.start).toBe('function')
    expect(typeof sas.confirm).toBe('function')
    expect(typeof qr.scan).toBe('function')
    expect(typeof qr.confirmScanned).toBe('function')
  })

  it('starts email setup through POST /v1/app/setup/start and /email', async () => {
    const calls: Array<{ method: string; path: string; body?: unknown }> = []
    server = Bun.serve({
      port: 0,
      async fetch(request) {
        const url = new URL(request.url)
        const body = await jsonBody(request)
        calls.push({ method: request.method, path: url.pathname, body })

        if (request.method === 'POST' && url.pathname === '/v1/app/setup/start') {
          return Response.json({ setupRequestID: 'setup-1', signInMethods: ['email'] })
        }

        if (request.method === 'POST' && url.pathname === '/v1/app/setup/email') {
          return new Response(null, { status: 200 })
        }

        return new Response(`unexpected ${request.method} ${url.pathname}`, { status: 500 })
      },
    })

    const result = await startEmailSetup(target(server.url.origin), 'person@example.com')

    expect(result).toEqual({ setupRequestID: 'setup-1' })
    expect(calls.map(call => [call.method, call.path])).toEqual([
      ['POST', '/v1/app/setup/start'],
      ['POST', '/v1/app/setup/email'],
    ])
    expect(calls[1]?.body).toEqual({ setupRequestID: 'setup-1', email: 'person@example.com' })
  })

  it('finishes email setup through POST /v1/app/setup/response', async () => {
    configDir = await useConfigDir()
    const calls: string[] = []
    server = Bun.serve({
      port: 0,
      async fetch(request) {
        const url = new URL(request.url)
        calls.push(`${request.method} ${url.pathname}`)

        if (request.method === 'POST' && url.pathname === '/v1/app/setup/response') {
          return Response.json({ matrix, session: { state: 'needs-verification' } })
        }

        return readAfterSetup(request)
      },
    })

    const result = await finishEmailSetup(target(server.url.origin), {
      code: '123456',
      setupRequestID: 'setup-1',
      yes: true,
    })

    expect(calls).toContain('POST /v1/app/setup/response')
    expect(result.readiness.state).toBe('needs-verification')
    expect(result.target.auth).toEqual({ source: 'manual', tokenType: 'Bearer' })
  })

  it('creates an account through POST /v1/app/setup/register when the code requires registration', async () => {
    configDir = await useConfigDir()
    const calls: Array<{ path: string; body?: unknown }> = []
    server = Bun.serve({
      port: 0,
      async fetch(request) {
        const url = new URL(request.url)
        const body = await jsonBody(request)
        calls.push({ path: `${request.method} ${url.pathname}`, body })

        if (request.method === 'POST' && url.pathname === '/v1/app/setup/response') {
          return Response.json({
            registrationRequired: true,
            leadToken: 'lead-1',
            setupRequestID: 'setup-1',
            usernameSuggestions: ['person'],
            copy: {},
          })
        }

        if (request.method === 'POST' && url.pathname === '/v1/app/setup/register') {
          return Response.json({ matrix, session: { state: 'needs-verification' } })
        }

        return readAfterSetup(request)
      },
    })

    await finishEmailSetup(target(server.url.origin), {
      code: '123456',
      setupRequestID: 'setup-1',
      username: 'person',
      yes: true,
    })

    expect(calls.find(call => call.path === 'POST /v1/app/setup/register')?.body).toEqual({
      acceptTerms: true,
      leadToken: 'lead-1',
      setupRequestID: 'setup-1',
      username: 'person',
    })
  })
})

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

async function jsonBody(request: Request): Promise<unknown> {
  if (request.method === 'GET') return {}

  return request.json().catch(() => ({}))
}

function readAfterSetup(request: Request): Response {
  const url = new URL(request.url)

  if (request.method === 'GET' && url.pathname === '/v1/app/setup') {
    return Response.json({ state: 'needs-verification', e2ee: { secrets: {} } })
  }

  if (request.method === 'GET' && url.pathname === '/v1/accounts') return Response.json({ items: [] })

  return new Response(`unexpected ${request.method} ${url.pathname}`, { status: 500 })
}

async function useConfigDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'beeper-setup-login-'))
  process.env.BEEPER_CLI_CONFIG_DIR = dir

  return dir
}

function target(baseURL: string): Target {
  return { id: 'server', type: 'server', baseURL }
}
