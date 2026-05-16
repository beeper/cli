type AnyRecord = Record<string, any>

export type AccountResolutionOptions = {
  allowMultiplePerInput?: boolean
}

export type ChatResolutionOptions = {
  accountIDs?: string[]
  pick?: number
}

export async function resolveAccountIDs(
  client: any,
  inputs?: string[],
  options: AccountResolutionOptions = {},
): Promise<string[] | undefined> {
  if (!inputs?.length) return undefined

  const accounts = accountItems(await client.accounts.list())
  const resolved: string[] = []
  for (const input of inputs) {
    const matches = matchAccounts(accounts, input)
    if (matches.length === 0) throw new Error(`No account matches "${input}"`)
    if (matches.length > 1 && !options.allowMultiplePerInput) {
      throw new Error(formatAmbiguous(`account "${input}"`, matches.map(formatAccount)))
    }
    resolved.push(...matches.map(account => String(account.accountID)))
  }

  return Array.from(new Set(resolved))
}

export async function resolveAccountID(client: any, input: string): Promise<string> {
  const [accountID] = await resolveAccountIDs(client, [input]) ?? []
  if (!accountID) throw new Error(`No account matches "${input}"`)
  return accountID
}

export async function listAccountIDs(client: any): Promise<string[]> {
  const accounts = accountItems(await client.accounts.list())
  return accounts.map(account => String(account.accountID)).filter(Boolean)
}

export async function resolveChatID(client: any, input: string, options: ChatResolutionOptions = {}): Promise<string> {
  const exact = await retrieveChat(client, input)
  if (exact) return exact.id

  const candidates = await collect<AnyRecord>(client.chats.search({
    accountIDs: options.accountIDs,
    query: input,
    scope: 'titles',
  }), 10)

  const normalizedInput = normalize(input)
  const exactMatches = candidates.filter(chat =>
    normalize(chat.id) === normalizedInput ||
    normalize(chat.localChatID) === normalizedInput ||
    normalize(chat.title) === normalizedInput
  )
  const matches = exactMatches.length ? exactMatches : candidates
  if (matches.length === 0) return input
  if (matches.length === 1) return String(matches[0]!.id)

  if (options.pick) {
    const selected = matches[options.pick - 1]
    if (!selected) throw new Error(`--pick ${options.pick} is outside the ${matches.length} matching chats`)
    return String(selected.id)
  }

  throw new Error(formatAmbiguous(`chat "${input}"`, matches.map(formatChat)))
}

function accountItems(accounts: unknown): AnyRecord[] {
  if (Array.isArray(accounts)) return accounts as AnyRecord[]
  return ((accounts as { items?: AnyRecord[] }).items ?? [])
}

function matchAccounts(accounts: AnyRecord[], input: string): AnyRecord[] {
  const normalizedInput = normalize(input)
  const exact = accounts.filter(account =>
    normalize(account.accountID) === normalizedInput ||
    normalize(account.network) === normalizedInput ||
    normalize(account.bridge?.type) === normalizedInput ||
    normalize(account.bridge?.id) === normalizedInput ||
    normalize(account.user?.id) === normalizedInput ||
    normalize(account.user?.username) === normalizedInput ||
    normalize(account.user?.displayName) === normalizedInput ||
    normalize(account.user?.name) === normalizedInput ||
    normalize(account.user?.email) === normalizedInput
  )
  if (exact.length) return exact

  return accounts.filter(account =>
    includesNormalized(account.accountID, normalizedInput) ||
    includesNormalized(account.network, normalizedInput) ||
    includesNormalized(account.bridge?.type, normalizedInput) ||
    includesNormalized(account.bridge?.id, normalizedInput) ||
    includesNormalized(account.user?.displayName, normalizedInput) ||
    includesNormalized(account.user?.name, normalizedInput)
  )
}

async function retrieveChat(client: any, input: string): Promise<AnyRecord | undefined> {
  try {
    return await client.chats.retrieve(input, { maxParticipantCount: 0 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (/not\s*found|404/i.test(message)) return undefined
    throw error
  }
}

async function collect<T>(iterable: AsyncIterable<T>, limit: number): Promise<T[]> {
  const items: T[] = []
  for await (const item of iterable) {
    items.push(item)
    if (items.length >= limit) break
  }
  return items
}

function normalize(value: unknown): string {
  return String(value ?? '').trim().toLowerCase().replace(/[\s._-]+/g, '')
}

function includesNormalized(value: unknown, normalizedInput: string): boolean {
  return normalize(value).includes(normalizedInput)
}

function formatAmbiguous(label: string, choices: string[]): string {
  return `Ambiguous ${label}. Use an exact ID or --pick N:\n${choices.map((choice, index) => `  ${index + 1}. ${choice}`).join('\n')}`
}

function formatAccount(account: AnyRecord): string {
  const network = account.network ? ` ${account.network}` : ''
  const bridge = account.bridge?.type ? ` ${account.bridge.type}` : ''
  const user = account.user?.displayName || account.user?.name || account.user?.username || account.user?.id || ''
  return `${account.accountID}${network}${bridge}${user ? ` ${user}` : ''}`
}

function formatChat(chat: AnyRecord): string {
  const network = chat.network ? ` ${chat.network}` : ''
  return `${chat.id}${network} ${chat.title ?? ''}`.trim()
}

export function userQueryFromInput(input: string): AnyRecord {
  const trimmed = input.trim()
  if (trimmed.includes('@')) return { email: trimmed, username: trimmed }
  if (/^\+?[\d\s().-]{5,}$/.test(trimmed)) return { phoneNumber: trimmed }
  return { fullName: trimmed, username: trimmed, id: trimmed }
}
