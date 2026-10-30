export type DataIntegrityState = 'ok' | 'degraded' | 'unknown'

export type DataIntegrityDiagnostic = {
  state: DataIntegrityState
  evidence: {
    accounts: number | null
    chats: number | null
    messages: number | null
    bridges: number | null
    bridgeLogins: number | null
    bridgeActiveAccounts: number | null
  }
  accountIDs: {
    accounts: string[]
    chats: string[]
    bridgeAccounts: string[]
    bridgeLogins: string[]
    missingFromAccounts: string[]
  }
  signals: string[]
  errors: string[]
}

type AnyRecord = Record<string, any>

export async function diagnoseDataIntegrity(client: any): Promise<DataIntegrityDiagnostic> {
  const errors: string[] = []
  const signals: string[] = []

  const accounts = await probe(async () => accountItems(await client.accounts.list()), 'accounts', errors)
  const chats = await probe(async () => collect(client.chats.list({ limit: 25 }), 25), 'chats', errors)
  const messages = await probe(async () => collect(client.messages.search({}), 1), 'messages', errors)
  const bridges = await probe(async () => bridgeItems(await client.bridges.list()), 'bridges', errors)

  const accountIDs = new Set((accounts ?? []).map(accountID).filter(Boolean))
  const chatAccountIDs = new Set((chats ?? []).map(accountID).filter(Boolean))
  const bridgeAccountIDs = new Set<string>()
  const bridgeLoginAccountIDs = new Set<string>()
  let bridgeLoginCount: number | null = 0
  let bridgeActiveAccountCount: number | null = bridges ? 0 : null

  if (bridges) {
    for (const bridge of bridges) {
      const bridgeID = String(bridge?.id ?? '')
      for (const account of bridge?.accounts ?? []) {
        const id = accountID(account)
        if (id) bridgeAccountIDs.add(id)
      }
      if (bridgeActiveAccountCount !== null) {
        const active = Number(bridge?.activeAccountCount ?? 0)
        if (Number.isFinite(active) && active > 0) bridgeActiveAccountCount += active
      }
      if (!bridgeID) continue
      try {
        const response = await client.bridges.logins.list(bridgeID)
        const logins = Array.isArray(response) ? response : (response?.items ?? [])
        if (bridgeLoginCount !== null) bridgeLoginCount += logins.length
        for (const login of logins) {
          for (const id of login?.accountIDs ?? []) {
            if (id) bridgeLoginAccountIDs.add(String(id))
          }
        }
      } catch (error) {
        errors.push(`bridge logins (${bridgeID}): ${errorText(error)}`)
        bridgeLoginCount = null
      }
    }
  } else {
    bridgeLoginCount = null
  }

  const missingFromAccounts = Array.from(
    new Set(
      [...chatAccountIDs, ...bridgeAccountIDs, ...bridgeLoginAccountIDs].filter(id => !accountIDs.has(id)),
    ),
  )

  if (missingFromAccounts.length) {
    signals.push(
      `Account discovery drift: ${missingFromAccounts.length} account ID(s) appear in chats or bridge logins but not in /v1/accounts.`,
    )
  }

  if ((bridgeActiveAccountCount ?? 0) > 0 && bridgeAccountIDs.size === 0 && bridgeLoginAccountIDs.size === 0) {
    signals.push(
      'Bridge state reports active accounts but exposes no account IDs through bridge accounts or bridge logins.',
    )
  }

  if ((chats?.length ?? 0) === 0 && (messages?.length ?? 0) > 0) {
    signals.push(
      'Chat index drift: message search returns data while the chat list is empty.',
    )
  }

  if (
    (accounts?.length ?? 0) > 0 &&
    (chats?.length ?? 0) === 0 &&
    messages !== null
  ) {
    signals.push(
      'Connected accounts are visible but no chats are returned.',
    )
  }

  const state: DataIntegrityState = signals.length
    ? 'degraded'
    : errors.length
      ? 'unknown'
      : 'ok'

  return {
    state,
    evidence: {
      accounts: accounts?.length ?? null,
      chats: chats?.length ?? null,
      messages: messages?.length ?? null,
      bridges: bridges?.length ?? null,
      bridgeLogins: bridgeLoginCount,
      bridgeActiveAccounts: bridgeActiveAccountCount,
    },
    accountIDs: {
      accounts: Array.from(accountIDs),
      chats: Array.from(chatAccountIDs),
      bridgeAccounts: Array.from(bridgeAccountIDs),
      bridgeLogins: Array.from(bridgeLoginAccountIDs),
      missingFromAccounts,
    },
    signals,
    errors,
  }
}

function accountItems(response: any): AnyRecord[] {
  if (Array.isArray(response)) return response
  return response?.items ?? []
}

function bridgeItems(response: any): AnyRecord[] {
  if (Array.isArray(response)) return response
  return response?.items ?? []
}

function accountID(value: AnyRecord): string {
  return String(value?.accountID ?? value?.id ?? '')
}

async function collect<T>(iterable: AsyncIterable<T>, limit: number): Promise<T[]> {
  const items: T[] = []
  for await (const item of iterable) {
    items.push(item)
    if (items.length >= limit) break
  }
  return items
}

async function probe<T>(
  run: () => Promise<T>,
  label: string,
  errors: string[],
): Promise<T | null> {
  try {
    return await run()
  } catch (error) {
    errors.push(`${label}: ${errorText(error)}`)
    return null
  }
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
