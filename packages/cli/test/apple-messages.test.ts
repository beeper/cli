import { describe, expect, it } from 'bun:test'
import { diagnoseAppleMessages, listAccountsIncludingNative } from '../src/lib/apple-messages.js'
import { resolveAccountID } from '../src/lib/resolve.js'

const chat = {
  id: 'imsg##thread:abc',
  accountID: 'imessage_deadbeef',
  network: 'iMessage',
  title: '+1 555 000 1234',
  type: 'single',
}

function pages<T>(items: T[]) {
  return async function* () {
    for (const item of items) yield item
  }()
}

describe('diagnoseAppleMessages', () => {
  it('discovers iMessage from chats when accounts API omits the native account', async () => {
    let listCalls = 0
    const client = {
      accounts: { list: async () => ({ items: [] }) },
      chats: {
        search: () => pages([chat]),
        list: () => pages([]),
      },
      messages: {
        list: async (_chatID: string, params: { cursor?: string; direction?: string }) => {
          listCalls += 1
          if (!params.cursor) {
            return {
              items: Array.from({ length: 20 }, (_, i) => ({ id: `m-${i}` })),
              hasMore: true,
              oldestCursor: '1712000000000',
            }
          }
          expect(params).toEqual({ cursor: '1712000000000', direction: 'before' })
          return { items: [], hasMore: false, oldestCursor: null }
        },
      },
    }

    const result = await diagnoseAppleMessages(client)

    expect(result.detected).toBe(true)
    expect(result.connectivity).toBe('unverified')
    expect(result.discovery).toBe('chats')
    expect(result.accountIDs).toEqual(['imessage_deadbeef'])
    expect(result.contactResolution.rawPhoneTitles).toBe(1)
    expect(result.historyPagination.state).toBe('broken')
    expect(listCalls).toBe(2)
    expect(result.actions.join(' ')).toMatch(/accounts API/)
    expect(result.actions.join(' ')).toMatch(/empty older-history page/)
  })

  it('reports healthy pagination when the second page contains messages', async () => {
    const resolvedChat = { ...chat, title: 'Jane Smith' }
    const client = {
      accounts: {
        list: async () => ({ items: [{ accountID: 'imessage_deadbeef', network: 'iMessage' }] }),
      },
      chats: {
        search: () => pages([resolvedChat]),
        list: () => pages([]),
      },
      messages: {
        list: async (_chatID: string, params: { cursor?: string }) => params.cursor
          ? { items: [{ id: 'older' }], hasMore: false, oldestCursor: null }
          : { items: [{ id: 'newer' }], hasMore: true, oldestCursor: 'cursor-1' },
      },
    }

    const result = await diagnoseAppleMessages(client)

    expect(result.discovery).toBe('accounts+chats')
    expect(result.contactResolution.resolvedTitles).toBe(1)
    expect(result.contactResolution.rawPhoneTitles).toBe(0)
    expect(result.historyPagination).toEqual({
      state: 'ok',
      firstPageItems: 1,
      secondPageItems: 1,
    })
  })

  it('does not call pagination when no Apple Messages chat is discoverable', async () => {
    let messageCalls = 0
    const client = {
      accounts: { list: async () => ({ items: [] }) },
      chats: {
        search: () => pages([]),
        list: () => pages([]),
      },
      messages: {
        list: async () => {
          messageCalls += 1
          return { items: [] }
        },
      },
    }

    const result = await diagnoseAppleMessages(client)

    expect(result.detected).toBe(false)
    expect(result.connectivity).toBe('unverified')
    expect(result.discovery).toBe('none')
    expect(result.historyPagination.state).toBe('unknown')
    expect(messageCalls).toBe(0)
  })

  it('never treats a cached native chat as verified live connectivity', async () => {
    const client = {
      accounts: { list: async () => ({ items: [] }) },
      chats: {
        search: () => pages([chat]),
        list: () => pages([]),
      },
      messages: { list: async () => { throw new Error('possibly stale cached chat') } },
    }

    const result = await diagnoseAppleMessages(client)
    expect(result.detected).toBe(true)
    expect(result.discovery).toBe('chats')
    expect(result.connectivity).toBe('unverified')
    expect(result.historyPagination.state).toBe('unknown')
    expect(result.historyPagination.error).not.toContain('possibly stale cached chat')
    expect(result.actions.join(' ')).toMatch(/does not verify live iMessage connectivity/)
  })

})

describe('native iMessage account discovery', () => {
  it('supplements accounts with the native account inferred from iMessage chats', async () => {
    const client = {
      accounts: {
        list: async () => ({ items: [{ accountID: 'whatsapp_1', network: 'WhatsApp' }] }),
      },
      chats: {
        search: () => pages([chat]),
        list: () => pages([]),
      },
    }

    const rows = await listAccountsIncludingNative(client)
    expect(rows).toEqual([
      { accountID: 'whatsapp_1', network: 'WhatsApp' },
      {
        accountID: 'imessage_deadbeef',
        network: 'iMessage',
        native: true,
        inferredFrom: 'chats',
      },
    ])
  })

  it('lets account selectors resolve the inferred iMessage account', async () => {
    const client = {
      accounts: {
        list: async () => ({ items: [{ accountID: 'whatsapp_1', network: 'WhatsApp' }] }),
      },
      chats: {
        search: () => pages([chat]),
        list: () => pages([]),
      },
    }

    await expect(resolveAccountID(client, 'iMessage')).resolves.toBe('imessage_deadbeef')
  })
  it('surfaces accounts API errors instead of treating a failed request as an empty account list', async () => {
    const client = {
      accounts: { list: async () => { throw new Error('401 Invalid token') } },
      chats: { search: () => pages([chat]), list: () => pages([]) },
    }
    await expect(listAccountsIncludingNative(client)).rejects.toThrow('401 Invalid token')
  })

  it('distinguishes an unavailable accounts API from a native account omission in diagnostics', async () => {
    const client = {
      accounts: { list: async () => { throw new Error('401 Invalid token') } },
      chats: { search: () => pages([chat]), list: () => pages([]) },
      messages: { list: async () => ({ items: [], hasMore: false, oldestCursor: null }) },
    }
    const result = await diagnoseAppleMessages(client)
    expect(result.detected).toBe(true)
    expect(result.connectivity).toBe('unverified')
    expect(result.accountProbe).toBe('error')
    expect(result.actions.join(' ')).toMatch(/Could not query \/v1\/accounts/)
    expect(result.actions.join(' ')).not.toMatch(/native account is omitted/)
    expect(JSON.stringify(result)).not.toContain('401 Invalid token')
  })

})
