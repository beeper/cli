import { describe, expect, it } from 'bun:test'
import { checkAccessToken, parseTimeoutMs } from '../src/lib/auth-health.js'

describe('checkAccessToken', () => {

  it('checks a bearer-protected endpoint, not the public setup endpoint', async () => {
    let requestedPath = ''
    const result = await checkAccessToken('http://127.0.0.1:23373', 'stale-bearer', {
      fetcher: async input => {
        requestedPath = new URL(String(input)).pathname
        return new Response('{}', { status: requestedPath === '/v1/app/setup' ? 200 : 401 })
      },
    })
    expect(requestedPath).toBe('/v1/accounts')
    expect(result).toEqual({ state: 'invalid', status: 401 })
    expect(JSON.stringify(result)).not.toContain('stale-bearer')
  })

  it('reports missing without making a request', async () => {
    let calls = 0
    const result = await checkAccessToken('http://127.0.0.1:23373', undefined, {
      fetcher: async () => {
        calls += 1
        return new Response(null, { status: 200 })
      },
    })

    expect(result).toEqual({ state: 'missing' })
    expect(calls).toBe(0)
  })

  it('reports valid when the target accepts the bearer', async () => {
    let authHeader: string | null = null
    const result = await checkAccessToken('http://127.0.0.1:23373', 'secret-token', {
      fetcher: async (_input, init) => {
        authHeader = new Headers(init?.headers).get('authorization')
        return new Response('{}', { status: 200 })
      },
    })

    expect(result).toEqual({ state: 'valid', status: 200 })
    expect(authHeader).toBe('Bearer secret-token')
  })

  it('reports invalid on authentication rejection without exposing the token', async () => {
    const result = await checkAccessToken('http://127.0.0.1:23373', 'secret-token', {
      fetcher: async () => new Response('Invalid token', { status: 401 }),
    })

    expect(result).toEqual({ state: 'invalid', status: 401 })
    expect(JSON.stringify(result)).not.toContain('secret-token')
  })

  it('reports unknown for non-auth failures', async () => {
    const statusResult = await checkAccessToken('http://127.0.0.1:23373', 'token', {
      fetcher: async () => new Response('server error', { status: 500 }),
    })
    expect(statusResult).toEqual({ state: 'unknown', status: 500 })

    const networkResult = await checkAccessToken('http://127.0.0.1:23373', 'token', {
      fetcher: async () => {
        throw new Error('connection refused')
      },
    })
    expect(networkResult).toEqual({ state: 'unknown', error: 'Token check failed; verify target connectivity and token configuration.' })
  })
})

describe('auth status credential/timeout regression', () => {
  it('never returns malformed bearer data from fetch errors', async () => {
    const token = 'line-one\nline-two-secret'
    const result = await checkAccessToken('http://127.0.0.1:23373', token, {
      fetcher: async () => {
        throw new TypeError(`Header authorization has invalid value: 'Bearer ${token}'`)
      },
    })
    expect(result.state).toBe('unknown')
    expect(JSON.stringify(result)).not.toContain(token)
    expect(JSON.stringify(result)).not.toContain('line-two-secret')
    expect(JSON.stringify(result)).not.toContain('Bearer')
  })

  it('parses the global timeout flag, including documented minute/hour units', () => {
    expect(parseTimeoutMs(undefined)).toBe(2_000)
    expect(parseTimeoutMs('500ms')).toBe(500)
    expect(parseTimeoutMs('30s')).toBe(30_000)
    expect(parseTimeoutMs('2m')).toBe(120_000)
    expect(parseTimeoutMs('1h')).toBe(3_600_000)
    expect(() => parseTimeoutMs('0ms')).toThrow()
    expect(() => parseTimeoutMs('abc')).toThrow()
    expect(() => parseTimeoutMs('999999999h')).toThrow()
  })

  it('honors the supplied small timeout rather than the default two seconds', async () => {
    const result = await checkAccessToken('http://127.0.0.1:23373', 'secret-token', {
      timeoutMs: 5,
      fetcher: async (_url, init) => new Promise<Response>((_resolve, reject) => {
        if (init?.signal?.aborted) return reject(new Error('aborted'))
        init?.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true })
      }),
    })
    expect(result.state).toBe('unknown')
    expect(JSON.stringify(result)).not.toContain('secret-token')
  })
})
