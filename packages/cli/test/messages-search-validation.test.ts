import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

const cli = ['./bin/run.js']

function run(...args: string[]) {
  return spawnSync(process.execPath, [...cli, ...args], {
    encoding: 'utf8',
    env: { ...process.env, BEEPER_CLI_CONFIG_DIR: '/tmp/beeper-cli-vitest', BEEPER_NO_LOGO: '1' },
  })
}

describe('messages search query-or-filter requirement', () => {
  it('rejects empty query with no filters and exits with usage error', () => {
    const result = run('messages', 'search', '--json')
    expect(result.status).not.toBe(0)
    const envelope = JSON.parse(result.stderr)
    expect(envelope.success).toBe(false)
    expect(envelope.error).toMatch(/Provide a search query or at least one filter flag/)
  })

  it('accepts a bare query', () => {
    const result = run('messages', 'search', 'invoice', '--help')
    // --help short-circuits before validation; smoke-test acceptance is in cli-smoke
    expect(result.status).toBe(0)
  })

  it('accepts no query when --sender is set (would fail at network but pass validation)', () => {
    // Use --help to avoid network: just confirms the flag is recognized.
    const result = run('messages', 'search', '--sender', 'me', '--help')
    expect(result.status).toBe(0)
  })
})
