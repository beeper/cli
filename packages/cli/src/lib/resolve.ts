import { readConfig } from './targets.js'
import { ambiguous, notFound } from './errors.js'
import { confirmSuggestion, declineWithExit127, rankSuggestions } from './did-you-mean.js'

type AnyRecord = Record<string, any>

export type AccountResolutionOptions = {
  allowMultiplePerInput?: boolean
  applyDefault?: boolean
}

export type ChatResolutionOptions = {
  accountIDs?: string[]
  pick?: number
  assumeYes?: boolean
}

export async function resolveAccountIDs(
  client: any,
  inputs?: string[],
  options: AccountResolutionOptions = {},
): Promise<string[] | undefined> {
  let effectiveInputs = inputs
  if (!effectiveInputs?.length && options.applyDefault !== false) {
    const config = await readConfig().catch(() => ({} as { defaultAccount?: string }))
    if (config.defaultAccount) effectiveInputs = [config.defaultAccount]
  }
  if (!effectiveInputs?.length) return undefined

  const accounts = accountItems(await client.accounts.list())
  const resolved: string[] = []
  for (const input of effectiveInputs) {
    const matches = matchAccounts(accounts, input)
    if (matches.length === 0) throw notFound(`No account matches "${input}"`)
    if (matches.length > 1 && !options.allowMultiplePerInput) {
      throw ambiguous(formatAmbiguous(`account "${input}"`, matches.map(formatAccount)))
    }
    resolved.push(...matches.map(account => String(account.accountID)))
  }

  return Array.from(new Set(resolved))
}

export async function resolveAccountID(client: any, input: string): Promise<string> {
  const [accountID] = await resolveAccountIDs(client, [input]) ?? []
  if (!accountID) throw notFound(`No account matches "${input}"`)
  return accountID
}

export async function listAccountIDs(client: any): Promise<string[]> {
  const accounts = accountItems(await client.accounts.list())
  return accounts.map(account => String(account.accountID)).filter(Boolean)
}

export async function resolveChatID(client: any, input: string, options: ChatResolutionOptions = {}): Promise<string> {
  if (input.startsWith('!')) return input
  const exact = await retrieveChat(client, input)
  if (exact) return chatInputID(exact)

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
  if (matches.length === 0) {
    const suggestion = await suggestChat(client, input, options)
    if (suggestion) return suggestion
    return input
  }
  if (matches.length === 1) return chatInputID(matches[0]!)

  if (options.pick) {
    const selected = matches[options.pick - 1]
    if (!selected) throw notFound(`--pick ${options.pick} is outside the ${matches.length} matching chats`)
    return chatInputID(selected)
  }

  throw ambiguous(formatAmbiguous(`chat "${input}"`, matches.map(formatChat)))
}

async function suggestChat(client: any, input: string, options: ChatResolutionOptions): Promise<string | undefined> {
  let pool: AnyRecord[]
  try {
    pool = await collect<AnyRecord>(client.chats.list({ accountIDs: options.accountIDs, limit: 100 }), 100)
  } catch {
    return undefined
  }
  const ranked = rankSuggestions(input, pool, chat => chat.title as string | undefined, 3)
  const top = ranked[0]
  if (!top) return undefined
  const detail = top.value.network ? ` (${top.value.network})` : ''
  const prompt = `No chat matches "${input}". Did you mean "${top.label}"${detail}?`
  process.stderr.write(`${prompt}\n`)
  for (const alt of ranked.slice(1)) {
    process.stderr.write(`  also: ${alt.label}${alt.value.network ? ` (${alt.value.network})` : ''}\n`)
  }
  const ok = await confirmSuggestion('use it?', { assumeYes: options.assumeYes, timeoutMs: 10_000 })
  if (!ok) declineWithExit127(`no chat selected for "${input}"`)
  return chatInputID(top.value)
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
  const local = chat.localChatID ? ` local:${chat.localChatID}` : ''
  return `${chat.id}${local}${network} ${chat.title ?? ''}`.trim()
}

function chatInputID(chat: AnyRecord): string {
  return String(chat.localChatID || chat.id)
}

export function userQueryFromInput(input: string): AnyRecord {
  const trimmed = input.trim()
  if (/^@[^:]+:.+/.test(trimmed)) return { id: trimmed, username: trimmed }
  if (trimmed.includes('@')) return { email: trimmed, username: trimmed }
  if (/^\+?[\d\s().-]{5,}$/.test(trimmed)) return { phoneNumber: trimmed }
  return { fullName: trimmed, username: trimmed, id: trimmed }
}
