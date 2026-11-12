import { afterAll, describe, expect, it } from 'bun:test'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { driveVerification } from '../src/lib/app-state.js'

const configDir = mkdtempSync(join(tmpdir(), 'beeper-verify-sas-'))
process.env.BEEPER_CLI_CONFIG_DIR = configDir
afterAll(() => rmSync(configDir, { recursive: true, force: true }))

const sas = { id: 'verification-123', purpose: 'device', direction: 'outgoing',
  state: 'sas_ready', availableActions: ['sas.confirm'], sas: { emojis: '🐼🔒🏁✈🎅🎺👍' } }
const pending = { state: 'needs-verification', verification: sas }
const ready = { state: 'needs-first-sync' }

async function withSetupServer(
  route: (method: string, path: string) => { status?: number; body: unknown },
  run: (baseURL: string) => Promise<void>,
) {
  const server = createServer((req, res) => {
    const result = route(req.method ?? '', req.url ?? '')
    res.writeHead(result.status ?? 200, { 'content-type': 'application/json' })
    res.end(JSON.stringify(result.body))
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  try {
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('Missing test server port')
    await run(`http://127.0.0.1:${address.port}`)
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()))
  }
}

describe('SAS device verification regression (#62)', () => {
  it('posts sas.confirm once when the POST response still lists the same action', async () => {
    let confirms = 0, gets = 0, creates = 0
    await withSetupServer((method, path) => {
      if (method === 'GET' && path === '/v1/app/setup') {
        gets++
        return { body: gets === 1 ? pending : ready }
      }
      if (method === 'POST' && path.endsWith('/sas/confirm')) {
        confirms++
        return { body: { session: pending } }
      }
      if (method === 'POST') creates++
      return { status: 404, body: {} }
    }, async baseURL => {
      const result = await driveVerification({ baseURL, token: false, yes: true })
      expect(result.state).toBe('needs-first-sync')
      expect(confirms).toBe(1)
      expect(creates).toBe(0)
      expect(gets).toBe(2)
    })
  })

  it('returns pending without a second confirm when the refreshed state is still stale', async () => {
    let confirms = 0, gets = 0
    await withSetupServer((method, path) => {
      if (method === 'GET' && path === '/v1/app/setup') {
        gets++
        return { body: pending }
      }
      if (method === 'POST' && path.endsWith('/sas/confirm')) {
        confirms++
        return { body: { session: pending } }
      }
      return { status: 404, body: {} }
    }, async baseURL => {
      const state = await driveVerification({ baseURL, token: false, yes: true })
      expect(state.state).toBe('needs-verification')
      expect(confirms).toBe(1)
      expect(gets).toBe(2)
    })
  })

  it('re-reads readiness when a raced 409 says verification is done', async () => {
    let confirms = 0
    await withSetupServer((method, path) => {
      if (method === 'GET') return { body: confirms ? ready : pending }
      if (method === 'POST' && path.endsWith('/sas/confirm')) {
        confirms++
        return { status: 409, body: {
          code: 'verification_action_not_available',
          details: { state: 'done' },
        } }
      }
      return { status: 404, body: {} }
    }, async baseURL => {
      expect((await driveVerification({ baseURL, token: false, yes: true })).state).toBe('needs-first-sync')
      expect(confirms).toBe(1)
    })
  })

  it('does not suppress other 409 errors', async () => {
    await withSetupServer((method, path) => {
      if (method === 'GET') return { body: pending }
      if (method === 'POST' && path.endsWith('/sas/confirm')) {
        return { status: 409, body: {
          code: 'verification_action_not_available',
          details: { state: 'requested' },
        } }
      }
      return { status: 404, body: {} }
    }, async baseURL => {
      await expect(driveVerification({ baseURL, token: false, yes: true })).rejects.toThrow('409')
    })
  })

  it('starts a request once and returns pending when the other device has not acted', async () => {
    let starts = 0
    await withSetupServer((method, path) => {
      if (method === 'GET' && path === '/v1/app/setup') {
        return { body: { state: 'needs-verification' } }
      }
      if (method === 'POST' && path === '/v1/app/setup/verifications') {
        starts++
        return { body: { session: {
          state: 'needs-verification',
          verification: { id: 'pending-1', state: 'requested', availableActions: [] },
        } } }
      }
      return { status: 404, body: {} }
    }, async baseURL => {
      expect((await driveVerification({ baseURL, token: false, yes: true })).state).toBe('needs-verification')
      expect(starts).toBe(1)
    })
  })
})
