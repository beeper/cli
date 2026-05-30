import { Args, Flags } from '@oclif/core'
import type { ChatStartParams } from '@beeper/desktop-api/resources/chats'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData, printDryRun } from '../../lib/output.js'
import { listAccountIDs, resolveAccountID, userQueryFromInput } from '../../lib/resolve.js'

export default class ChatsStart extends BeeperCommand {
  static override summary = 'Start a chat'
  static override args = { user: Args.string({ required: true, description: 'User ID, phone number, email, or display name' }) }
  static override flags = {
    account: Flags.string({ description: 'Account selector. Defaults to the single available account or the matrix account.' }),
    title: Flags.string({ description: 'Optional initial title for a new group chat' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ChatsStart)
    ensureWritable(flags)
    const client = await createClient(flags)
    const accountID = flags.account ? await resolveAccountID(client, flags.account) : await defaultAccountID(client)
    const user = userQueryFromInput(args.user)
    const payload: ChatStartParams & { title?: string } = { accountID, user, title: flags.title }
    if (flags['dry-run']) {
      await printDryRun('chats.start', payload as unknown as Record<string, unknown>, flags.json ? 'json' : 'human')
      return
    }
    await printData(await client.chats.start(payload), flags.json ? 'json' : 'human')
  }
}

async function defaultAccountID(client: any): Promise<string> {
  const accountIDs = await listAccountIDs(client)
  if (accountIDs.includes('matrix')) return 'matrix'
  if (accountIDs.length === 1 && accountIDs[0]) return accountIDs[0]
  throw new Error('Use --account to choose which account should start the chat.')
}
