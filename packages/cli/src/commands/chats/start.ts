import { Args, Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData } from '../../lib/output.js'
import { createMatrixDM } from '../../lib/matrix-direct.js'
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
    try {
      await printData(await client.chats.start({ accountID, user, title: flags.title } as any), flags.json ? 'json' : 'human')
    } catch (error) {
      if (accountID !== 'matrix' || !user.id || !/uninitialized undefined account: hungryserv|getChat/i.test(error instanceof Error ? error.message : String(error))) throw error
      const room = await createMatrixDM(flags, user.id)
      await printData({
        accountID: 'matrix',
        chatID: room.room_id,
        id: room.room_id,
        network: 'Beeper',
        participants: { hasMore: false, items: [], total: 0 },
        status: 'created',
        title: user.id,
        type: 'single',
        unreadCount: 0,
      }, flags.json ? 'json' : 'human')
    }
  }
}

async function defaultAccountID(client: any): Promise<string> {
  const accountIDs = await listAccountIDs(client)
  if (accountIDs.includes('matrix')) return 'matrix'
  if (accountIDs.length === 1 && accountIDs[0]) return accountIDs[0]
  throw new Error('Use --account to choose which account should start the chat.')
}
