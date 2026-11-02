import { Args, Flags } from '@oclif/core'
import { BeeperCommand } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { usageError } from '../../lib/errors.js'
import { collectPage, printIDs, printList } from '../../lib/output.js'
import { resolveAccountIDs, resolveChatID } from '../../lib/resolve.js'
import { withInkSpinner as withSpinner } from '../../lib/ink/spinner.js'

export default class MessagesSearch extends BeeperCommand {
  static override summary = 'Search messages across chats'
  static override examples = [
    'beeper messages search "quarterly report"',
    'beeper messages search --chat "Work" --sender me --limit 20',
    'beeper messages search --media image --after 2024-01-01T00:00:00Z',
    'beeper messages search --chat-type group --sender others "meeting"',
  ]
  static override args = {
    query: Args.string({ description: 'Search text (literal word match)', required: false }),
  }
  static override flags = {
    account: Flags.string({ multiple: true, description: 'Limit to an account selector. Repeat for multiple.' }),
    chat: Flags.string({ multiple: true, description: 'Limit to a chat selector. Repeat for multiple.' }),
    'chat-type': Flags.string({ options: ['group', 'single'], description: 'Only group chats or direct messages' }),
    after: Flags.string({ description: 'Only messages at or after this ISO timestamp' }),
    before: Flags.string({ description: 'Only messages at or before this ISO timestamp' }),
    'exclude-low-priority': Flags.boolean({ allowNo: true, description: 'Exclude low-priority chats' }),
    ids: Flags.boolean({ default: false, description: 'Print only message IDs' }),
    'include-muted': Flags.boolean({ allowNo: true, default: true, description: 'Include muted chats' }),
    limit: Flags.integer({ default: 50, description: 'Maximum results' }),
    media: Flags.string({ multiple: true, options: ['any', 'video', 'image', 'link', 'file'], description: 'Filter by media type. Repeat for multiple.' }),
    sender: Flags.string({ description: 'me, others, or a user ID' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(MessagesSearch)
    const hasFilter = Boolean(
      flags.account?.length || flags.chat?.length || flags['chat-type']
      || flags.after || flags.before || flags.media?.length
      || flags.sender,
    )
    if (!args.query && !hasFilter) {
      throw usageError('Provide a search query or at least one filter flag (--chat, --sender, --media, etc.).')
    }
    const client = await createClient(flags)
    const accountIDs = await resolveAccountIDs(client, flags.account, { allowMultiplePerInput: true })
    const chatIDs = flags.chat?.length
      ? await Promise.all(flags.chat.map(chat => resolveChatID(client, chat, { accountIDs })))
      : undefined
    const params = {
      accountIDs,
      chatIDs,
      chatType: flags['chat-type'] as 'group' | 'single' | undefined,
      dateAfter: flags.after,
      dateBefore: flags.before,
      excludeLowPriority: flags['exclude-low-priority'],
      includeMuted: flags['include-muted'],
      mediaTypes: flags.media as Array<'any' | 'video' | 'image' | 'link' | 'file'> | undefined,
      query: args.query,
      sender: flags.sender as 'me' | 'others' | (string & {}) | undefined,
    }
    const useSpinner = !flags.json && !flags.ids
    const label = args.query ? `Searching messages for "${args.query}"…` : 'Searching messages…'
    const load = () => collectMessageSearch(client, params, flags.limit, chatIDs)
    const items = useSpinner
      ? await withSpinner(label, load, {
        done: value => `${value.length} match${value.length === 1 ? '' : 'es'}`,
      })
      : await load()
    if (flags.ids) {
      printIDs(items)
      return
    }
    await printList(items, flags.json ? 'json' : 'human', {
      title: 'No messages matched',
      subtitle: args.query ? `Nothing found for "${args.query}".` : 'Try a different filter combination.',
      suggestions: [
        { command: 'beeper messages list --chat <chat>', hint: 'list messages from a chat' },
        { command: 'beeper chats search "<term>"', hint: 'search chats instead' },
      ],
    })
  }
}


async function collectMessageSearch(
  client: any,
  params: Record<string, unknown> & { accountIDs?: string[]; chatIDs?: string[] },
  limit: number,
  resolvedChatIDs?: string[],
): Promise<any[]> {
  if (!resolvedChatIDs?.length) {
    return collectPage(client.messages.search(params), limit)
  }

  // Desktop currently truncates message search to one result per chat when chatIDs
  // is supplied. Search the relevant account(s) instead, then apply the exact chat
  // filter client-side so CLI results are not silently incomplete.
  const allowedChatIDs = new Set(resolvedChatIDs.map(String))
  const accountIDs = new Set<string>()
  let canScopeAccounts = true

  for (const chatID of resolvedChatIDs) {
    try {
      const chat = await client.chats.retrieve(chatID)
      if (chat?.id) allowedChatIDs.add(String(chat.id))
      if (chat?.localChatID) allowedChatIDs.add(String(chat.localChatID))
      if (chat?.accountID) accountIDs.add(String(chat.accountID))
      const memberChatIDs = chat?.merge?.chatIDs
      if (Array.isArray(memberChatIDs) && memberChatIDs.length) {
        canScopeAccounts = false
        for (const memberChatID of memberChatIDs) allowedChatIDs.add(String(memberChatID))
      }
    } catch {
      // The resolver already identified this chat. Keep the resolved selector in
      // the filter even if details cannot be loaded for account narrowing.
      canScopeAccounts = false
    }
  }

  const scopedAccountIDs = params.accountIDs?.length
    ? params.accountIDs
    : canScopeAccounts && accountIDs.size
      ? Array.from(accountIDs)
      : undefined

  const safeParams = {
    ...params,
    accountIDs: scopedAccountIDs,
    chatIDs: undefined,
  }

  const items: any[] = []
  for await (const message of client.messages.search(safeParams)) {
    if (!allowedChatIDs.has(String(message?.chatID ?? ''))) continue
    items.push(message)
    if (items.length >= limit) break
  }
  return items
}
