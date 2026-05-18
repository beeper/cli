import { Args, Command, Flags } from '@oclif/core'
import { resolveTarget, listTargets } from '../lib/targets.js'
import { BeeperDesktop } from '@beeper/desktop-api'

type Kind = 'chat' | 'account' | 'contact' | 'target'

export default class Complete extends Command {
  static override hidden = true
  static override summary = 'Internal: emit completion suggestions for chats/contacts/accounts/targets'
  static override description = 'Used by the semantic shell completion wrapper. Prints one suggestion per line as `id\\tdescription`. Stays silent on any error so the shell completion never produces noise.'
  static override args = {
    kind: Args.string({ required: true, description: 'chat|account|contact|target', options: ['chat', 'account', 'contact', 'target'] }),
  }
  static override flags = {
    query: Flags.string({ description: 'Filter suggestions by a substring (already-typed prefix)' }),
    target: Flags.string({ description: 'Target name override' }),
    limit: Flags.integer({ default: 25, description: 'Max suggestions to print' }),
    'timeout-ms': Flags.integer({ default: 1500, description: 'Live-fetch timeout' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Complete)
    const kind = args.kind as Kind
    try {
      const lines = await Promise.race([
        emit(kind, flags),
        new Promise<string[]>((_, reject) => setTimeout(() => reject(new Error('timeout')), flags['timeout-ms'])),
      ])
      const filtered = flags.query ? lines.filter(line => fuzzy(line, flags.query!)) : lines
      for (const line of filtered.slice(0, flags.limit)) process.stdout.write(`${line}\n`)
    } catch {
      // intentionally silent: completion noise is worse than no suggestions
    }
  }
}

async function emit(kind: Kind, flags: { target?: string }): Promise<string[]> {
  if (kind === 'target') {
    const targets = await listTargets()
    return targets.map(t => `${t.id}\t${t.type} ${t.baseURL}`)
  }
  const target = await resolveTarget({ target: flags.target })
  const token = target.auth?.accessToken
  if (!token) return []
  const client = new BeeperDesktop({ baseURL: target.baseURL, accessToken: token, logLevel: 'warn' })

  if (kind === 'account') {
    const list = await client.accounts.list()
    const rows = Array.isArray(list) ? list : ((list as { items?: unknown[] }).items ?? [])
    return rows
      .map((row): string | undefined => {
        if (!row || typeof row !== 'object') return undefined
        const r = row as Record<string, unknown>
        const label = [r.network, r.user && typeof r.user === 'object' ? (r.user as Record<string, unknown>).displayName : undefined].filter(Boolean).join(' ')
        return r.accountID ? `${String(r.accountID)}\t${label}` : undefined
      })
      .filter((line): line is string => !!line)
  }

  if (kind === 'chat') {
    const out: string[] = []
    for await (const chat of client.chats.list({ limit: 50 } as never)) {
      const c = chat as unknown as Record<string, unknown>
      const id = c.localChatID || c.id
      const title = (c.title as string | undefined) ?? ''
      const network = (c.network as string | undefined) ?? ''
      if (id) out.push(`${String(id)}\t${title}${network ? ` (${network})` : ''}`)
      if (out.length >= 50) break
    }
    return out
  }

  if (kind === 'contact') {
    const out: string[] = []
    for await (const contact of client.contacts.list({ limit: 50 } as never)) {
      const c = contact as unknown as Record<string, unknown>
      const id = c.id || c.username
      const name = (c.fullName as string | undefined) || (c.displayName as string | undefined) || ''
      if (id) out.push(`${String(id)}\t${name}`)
      if (out.length >= 50) break
    }
    return out
  }

  return []
}

function fuzzy(line: string, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return line.toLowerCase().includes(q)
}
