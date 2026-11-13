export type AccessTokenCheck = {
  state: 'valid' | 'invalid' | 'unknown' | 'missing'
  status?: number
  error?: string
}

/** Translate the CLI's documented --timeout syntax into a safe timer duration. */
export function parseTimeoutMs(value: string | undefined): number {
  if (value === undefined) return 2_000
  const match = value.trim().match(/^(\d+(?:\.\d+)?)(ms|s|m|h)?$/i)
  if (!match) throw new Error('Invalid --timeout. Use a positive duration such as 500ms, 30s, 2m, or 1h.')
  const unit = (match[2] ?? 'ms').toLowerCase()
  const multiplier = { ms: 1, s: 1_000, m: 60_000, h: 3_600_000 }[unit as 'ms' | 's' | 'm' | 'h']
  const milliseconds = Math.round(Number(match[1]) * multiplier)
  if (!Number.isSafeInteger(milliseconds) || milliseconds < 1 || milliseconds > 2_147_483_647) {
    throw new Error('Invalid --timeout. Duration must be between 1ms and 2147483647ms.')
  }
  return milliseconds
}

export async function checkAccessToken(
  baseURL: string,
  token: string | undefined,
  options: {
    timeoutMs?: number
    fetcher?: typeof fetch
  } = {},
): Promise<AccessTokenCheck> {
  if (!token) return { state: 'missing' }

  const fetcher = options.fetcher ?? fetch
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 2_000)

  try {
    // /v1/app/setup is public and may return 200 during needs-login; accounts is bearer-protected.
    // We only inspect the status code, never log or retain the response body.
    const response = await fetcher(new URL('/v1/accounts', baseURL), {
      headers: { authorization: `Bearer ${token}` },
      signal: controller.signal,
    })

    if (response.status === 401 || response.status === 403) {
      return { state: 'invalid', status: response.status }
    }
    if (response.ok) return { state: 'valid', status: response.status }

    return { state: 'unknown', status: response.status }
  } catch {
    // Fetch implementations can echo the Authorization header (including the bearer) in errors.
    // Never return a raw exception from a request that included a credential.
    return { state: 'unknown', error: 'Token check failed; verify target connectivity and token configuration.' }
  } finally {
    clearTimeout(timeout)
  }
}
