import { describe, expect, it, mock } from 'bun:test'
import { resolveVerificationID } from '../src/lib/app-state.js'

const clientWith = (items: Array<{ id: string }>) => {
  const list = mock(async () => ({ items }))
  return { list, client: { app: { verifications: { list } } } }
}

describe('resolveVerificationID', () => {
  it('uses the active verification ID from the API when no --id is given', async () => {
    const { client } = clientWith([{ id: 'txn-123' }])
    expect(await resolveVerificationID(client)).toBe('txn-123')
  })

  it('uses an explicit --id without listing', async () => {
    const { client, list } = clientWith([{ id: 'txn-123' }])
    expect(await resolveVerificationID(client, 'txn-explicit')).toBe('txn-explicit')
    expect(list).not.toHaveBeenCalled()
  })

  it('fails with a next step when there is no active verification', async () => {
    const { client } = clientWith([])
    await expect(resolveVerificationID(client)).rejects.toThrow('No active verification. Start one with `beeper verify`.')
  })
})
