import { describe, expect, it } from 'bun:test'
import { diagnoseDataIntegrity } from '../src/lib/data-integrity.js'

function page<T>(items: T[]) {
  return async function* () {
    for (const item of items) yield item
  }()
}

describe('diagnoseDataIntegrity', () => {
  it('reports ok when accounts, chats, messages, and bridge logins agree', async () => {
    const client = {
      accounts: { list: async () => ({ items: [{ accountID: 'account-1' }] }) },
      chats: { list: () => page([{ id: 'chat-1', accountID: 'account-1' }]) },
      messages: { search: () => page([{ id: 'message-1', accountID: 'account-1', chatID: 'chat-1' }]) },
      bridges: {
        list: async () => ({ items: [{ id: 'bridge-1', activeAccountCount: 1, accounts: [{ accountID: 'account-1' }] }] }),
        logins: { list: async () => ({ items: [{ loginID: 'login-1', accountIDs: ['account-1'] }] }) },
      },
    }

    const result = await diagnoseDataIntegrity(client)

    expect(result.state).toBe('ok')
    expect(result.signals).toEqual([])
    expect(result.errors).toEqual([])
    expect(result.evidence).toEqual({
      accounts: 1,
      chats: 1,
      messages: 1,
      bridges: 1,
      bridgeLogins: 1,
      bridgeActiveAccounts: 1,
    })
    expect(result.accountIDs.missingFromAccounts).toEqual([])
  })

  it('detects account IDs that exist in chats or bridge logins but not accounts', async () => {
    const client = {
      accounts: { list: async () => ({ items: [{ accountID: 'account-1' }] }) },
      chats: { list: () => page([{ id: 'chat-2', accountID: 'account-2' }]) },
      messages: { search: () => page([]) },
      bridges: {
        list: async () => ({ items: [{ id: 'bridge-1', activeAccountCount: 1, accounts: [{ accountID: 'account-3' }] }] }),
        logins: { list: async () => ({ items: [{ loginID: 'login-2', accountIDs: ['account-3'] }] }) },
      },
    }

    const result = await diagnoseDataIntegrity(client)

    expect(result.state).toBe('degraded')
    expect(result.accountIDs.missingFromAccounts.sort()).toEqual(['account-2', 'account-3'])
    expect(result.signals.join(' ')).toMatch(/Account discovery drift/)
  })

  it('detects chat-index drift when message search has data but chats are empty', async () => {
    const client = {
      accounts: { list: async () => ({ items: [{ accountID: 'account-1' }] }) },
      chats: { list: () => page([]) },
      messages: { search: () => page([{ id: 'message-1', accountID: 'account-1', chatID: 'chat-1' }]) },
      bridges: {
        list: async () => ({ items: [] }),
        logins: { list: async () => ({ items: [] }) },
      },
    }

    const result = await diagnoseDataIntegrity(client)

    expect(result.state).toBe('degraded')
    expect(result.signals.join(' ')).toMatch(/message search returns data while the chat list is empty/i)
  })

  it('detects bridge state that claims active accounts without exposing their IDs', async () => {
    const client = {
      accounts: { list: async () => ({ items: [] }) },
      chats: { list: () => page([]) },
      messages: { search: () => page([]) },
      bridges: {
        list: async () => ({ items: [{ id: 'bridge-1', activeAccountCount: 2, accounts: [] }] }),
        logins: { list: async () => ({ items: [] }) },
      },
    }

    const result = await diagnoseDataIntegrity(client)

    expect(result.state).toBe('degraded')
    expect(result.evidence.bridgeActiveAccounts).toBe(2)
    expect(result.signals.join(' ')).toMatch(/active accounts but exposes no account IDs/i)
  })

  it('reports unknown when a probe fails without contradictory evidence', async () => {
    const client = {
      accounts: { list: async () => { throw new Error('accounts unavailable') } },
      chats: { list: () => page([]) },
      messages: { search: () => page([]) },
      bridges: {
        list: async () => ({ items: [] }),
        logins: { list: async () => ({ items: [] }) },
      },
    }

    const result = await diagnoseDataIntegrity(client)

    expect(result.state).toBe('unknown')
    expect(result.errors).toEqual(['accounts: accounts unavailable'])
  })
})
