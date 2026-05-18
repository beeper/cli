import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let tmp: string
const configFile = () => join(tmp, 'config.json')

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'beeper-cli-test-'))
  process.env.BEEPER_CLI_CONFIG_DIR = tmp
  vi.resetModules()
})

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true })
  delete process.env.BEEPER_CLI_CONFIG_DIR
})

describe('config persists defaultAccount', () => {
  it('updateConfig writes the file with the new field', async () => {
    const { readConfig, updateConfig } = await import('../src/lib/targets.js')
    await updateConfig(config => ({ ...config, defaultAccount: 'whatsapp-main' }))
    const after = await readConfig()
    expect(after.defaultAccount).toBe('whatsapp-main')
    const raw = JSON.parse(readFileSync(configFile(), 'utf8'))
    expect(raw.defaultAccount).toBe('whatsapp-main')
  })

  it('clearing sets defaultAccount to undefined', async () => {
    const { readConfig, updateConfig } = await import('../src/lib/targets.js')
    await updateConfig(config => ({ ...config, defaultAccount: 'work' }))
    await updateConfig(config => ({ ...config, defaultAccount: undefined }))
    const cleared = await readConfig()
    expect(cleared.defaultAccount).toBeUndefined()
  })
})
