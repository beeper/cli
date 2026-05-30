import { Args, Flags } from '@oclif/core'
import { BeeperCommand } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { notFound } from '../../lib/errors.js'
import { collectPage, printData } from '../../lib/output.js'
import { resolveAccountIDs } from '../../lib/resolve.js'

export default class ResolveChat extends BeeperCommand {
  static override summary = 'Resolve a chat selector to concrete chat candidates'
  static override args = {
    selector: Args.string({ required: true, description: 'Chat ID, local ID, exact title, or search text' }),
  }
  static override flags = {
    account: Flags.string({ multiple: true, description: 'Limit to account selector. Repeat for multiple.' }),
    pick: Flags.integer({ description: 'Select the Nth candidate (1-indexed)' }),
    limit: Flags.integer({ default: 10, description: 'Maximum candidates to return' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ResolveChat)
    const client = await createClient(flags)
    const accountIDs = await resolveAccountIDs(client, flags.account, { allowMultiplePerInput: true })
    const candidates = await collectPage<Chat>(client.chats.search({ accountIDs, query: args.selector, scope: 'titles' }), flags.limit)
    const normalized = normalize(args.selector)
    const exact = candidates.filter(chat =>
      normalize(chat.id) === normalized ||
      normalize(chat.localChatID) === normalized ||
      normalize(chat.title) === normalized
    )
    const matches = exact.length ? exact : candidates
    if (!matches.length) throw notFound(`No chat matches "${args.selector}"`, { selector: args.selector, kind: 'chat' })
    const selected = flags.pick ? matches[flags.pick - 1] : matches.length === 1 ? matches[0] : undefined
    if (flags.pick && !selected) throw notFound(`--pick ${flags.pick} is outside the ${matches.length} matching chats`, { selector: args.selector, pick: flags.pick, count: matches.length })
    await printData({
      selector: args.selector,
      kind: 'chat',
      selected: selected ? chatCandidate(selected, matches.indexOf(selected) + 1) : null,
      candidates: matches.map((chat, index) => chatCandidate(chat, index + 1)),
    }, flags.json ? 'json' : 'human')
  }
}

type Chat = Record<string, any>

function chatCandidate(chat: Chat, pick: number): Record<string, unknown> {
  return {
    pick,
    id: chat.id,
    localChatID: chat.localChatID,
    title: chat.title,
    network: chat.network,
    accountID: chat.accountID,
    raw: chat,
  }
}

function normalize(value: unknown): string {
  return String(value ?? '').trim().toLowerCase().replace(/[\s._-]+/g, '')
}
