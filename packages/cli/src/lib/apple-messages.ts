export type AppleMessagesPaginationState = 'ok' | 'broken' | 'insufficient-history' | 'unknown'

export type AppleMessagesDiagnostics = {
  detected: boolean
  connectivity: 'unverified'
  accountProbe: 'ok' | 'error'
  discovery: 'accounts' | 'chats' | 'accounts+chats' | 'none'
  accountIDs: string[]
  sampledChats: number
  contactResolution: {
    sampledDirectChats: number
    resolvedTitles: number
    rawPhoneTitles: number
  }
  historyPagination: {
    state: AppleMessagesPaginationState
    firstPageItems?: number
    secondPageItems?: number
    error?: string
  }
  actions: string[]
}

type AnyRecord = Record<string, any>

export async function listAccountsIncludingNative(client: any): Promise<AnyRecord[]> {
  const rows = await listAccounts(client)
  if (rows.some(isAppleAccount)) return rows

  const chats = await findAppleChats(client)
  const inferred = new Map<string, AnyRecord>()
  for (const chat of chats) {
    const id = accountID(chat)
    if (!id || inferred.has(id)) continue
    inferred.set(id, {
      accountID: id,
      network: 'iMessage',
      native: true,
      inferredFrom: 'chats',
    })
  }

  return [...rows, ...inferred.values()]
}

export async function diagnoseAppleMessages(client: any): Promise<AppleMessagesDiagnostics> {
  let accountRows: AnyRecord[] = []
  let accountProbe: AppleMessagesDiagnostics['accountProbe'] = 'ok'
  try {
    accountRows = await listAccounts(client)
  } catch {
    accountProbe = 'error'
  }
  const accountIDsFromAccounts = new Set(
    accountRows.filter(isAppleAccount).map(accountID).filter(Boolean),
  )

  const chats = await findAppleChats(client)
  const accountIDsFromChats = new Set(
    chats.map(accountID).filter(Boolean),
  )

  const accountIDs = Array.from(new Set([...accountIDsFromAccounts, ...accountIDsFromChats]))
  const directChats = chats.filter(chat => chat?.type === 'single')
  const rawPhoneTitles = directChats.filter(chat => looksLikePhone(chat?.title)).length
  const resolvedTitles = directChats.filter(chat => typeof chat?.title === 'string' && chat.title.trim() && !looksLikePhone(chat.title)).length

  let discovery: AppleMessagesDiagnostics['discovery'] = 'none'
  if (accountIDsFromAccounts.size && accountIDsFromChats.size) discovery = 'accounts+chats'
  else if (accountIDsFromAccounts.size) discovery = 'accounts'
  else if (accountIDsFromChats.size) discovery = 'chats'

  const historyPagination = await checkAppleHistoryPagination(client, chats)
  const actions: string[] = []

  if (discovery === 'chats') {
    if (accountProbe === 'ok') {
      actions.push('Apple Messages chats exist but the native account is omitted from /v1/accounts; do not treat accounts list as proof of disconnection.')
    } else {
      actions.push('Could not query /v1/accounts. Chat evidence cannot establish whether the native account is listed; check authentication and target reachability.')
    }
  }
  if (rawPhoneTitles > 0) {
    actions.push('Some Apple Messages chat titles are unresolved phone numbers; contact-name enrichment is incomplete in the API.')
  }
  if (historyPagination.state === 'broken') {
    actions.push('Do not treat an empty older-history page as the end of the conversation; Apple Messages cursor pagination is currently returning an invalid empty page.')
  }
  if (discovery === 'none') {
    actions.push(accountProbe === 'error'
      ? 'Could not query /v1/accounts and found no native chats. Check API authentication and target reachability before drawing a connectivity conclusion.'
      : 'No Apple Messages account or chat was discoverable. This does not prove disconnection; verify the native account in Beeper Desktop on the target Mac.')
  } else {
    actions.push('Native account/chat discovery does not verify live iMessage connectivity or delivery. For a user-approved test, send to a known recipient with --wait.')
  }

  return {
    detected: discovery !== 'none',
    connectivity: 'unverified',
    accountProbe,
    discovery,
    accountIDs,
    sampledChats: chats.length,
    contactResolution: {
      sampledDirectChats: directChats.length,
      resolvedTitles,
      rawPhoneTitles,
    },
    historyPagination,
    actions,
  }
}

async function listAccounts(client: any): Promise<AnyRecord[]> {
  // Commands must surface authentication/network failures instead of quietly
  // replacing the account list with a possibly stale chat-derived projection.
  const response = await client.accounts.list()
  return Array.isArray(response) ? response : (response?.items ?? [])
}

async function findAppleChats(client: any): Promise<AnyRecord[]> {
  try {
    const items = await collect(client.chats.search({
      query: 'iMessage',
      scope: 'titles',
      limit: 20,
    }), 20)
    const apple = items.filter(isAppleChat)
    if (apple.length) return apple
  } catch {
    // Fall through to recent chat listing. Doctor should still produce a useful
    // answer when search itself is unhealthy.
  }

  try {
    const items = await collect(client.chats.list({ limit: 100 }), 100)
    return items.filter(isAppleChat)
  } catch {
    return []
  }
}

async function checkAppleHistoryPagination(
  client: any,
  chats: AnyRecord[],
): Promise<AppleMessagesDiagnostics['historyPagination']> {
  const chat = chats.find(item => typeof (item?.localChatID ?? item?.id) === 'string')
  if (!chat) return { state: 'unknown', error: 'No Apple Messages chat was available for a pagination probe.' }

  const chatID = String(chat.localChatID ?? chat.id)
  try {
    const first = await client.messages.list(chatID, {})
    const firstItems = pageItems(first)
    const hasMore = first?.hasMore === true
    const cursor = first?.oldestCursor

    if (!hasMore || typeof cursor !== 'string' || cursor.length === 0) {
      return { state: 'insufficient-history', firstPageItems: firstItems.length }
    }

    const second = await client.messages.list(chatID, { cursor, direction: 'before' })
    const secondItems = pageItems(second)
    if (firstItems.length > 0 && secondItems.length === 0) {
      return { state: 'broken', firstPageItems: firstItems.length, secondPageItems: 0 }
    }

    return { state: 'ok', firstPageItems: firstItems.length, secondPageItems: secondItems.length }
  } catch {
    return {
      state: 'unknown',
      error: 'Pagination probe failed; inspect the Desktop connection and API permissions.',
    }
  }
}

function pageItems(page: any): unknown[] {
  if (Array.isArray(page?.items)) return page.items
  if (typeof page?.getPaginatedItems === 'function') {
    const items = page.getPaginatedItems()
    return Array.isArray(items) ? items : []
  }
  return []
}

function isAppleAccount(row: AnyRecord): boolean {
  const id = accountID(row).toLowerCase()
  const network = String(row?.network ?? row?.name ?? '').toLowerCase()
  return id.startsWith('imessage_') || id.startsWith('imsg') || network === 'imessage' || network === 'apple messages'
}

function isAppleChat(chat: AnyRecord): boolean {
  const id = String(chat?.id ?? chat?.localChatID ?? '').toLowerCase()
  const account = accountID(chat).toLowerCase()
  const network = String(chat?.network ?? '').toLowerCase()
  return id.startsWith('imsg##') || account.startsWith('imessage_') || network === 'imessage' || network === 'apple messages'
}

function accountID(row: AnyRecord): string {
  return String(row?.accountID ?? row?.id ?? '')
}

function looksLikePhone(value: unknown): boolean {
  return /^\+?[\d\s().-]{5,}$/.test(String(value ?? '').trim())
}

async function collect(iterable: AsyncIterable<AnyRecord>, limit: number): Promise<AnyRecord[]> {
  const items: AnyRecord[] = []
  for await (const item of iterable) {
    items.push(item)
    if (items.length >= limit) break
  }
  return items
}
