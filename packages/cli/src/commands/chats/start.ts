import { Args, Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData } from '../../lib/output.js'
import { resolveAccountID } from '../../lib/resolve.js'

export default class ChatsStart extends BeeperCommand {
  static override summary = 'Start a chat'
  static override args = { user: Args.string({ required: true }) }
  static override flags = { account: Flags.string(), title: Flags.string() }
  async run(): Promise<void> {
    const { args, flags } = await this.parse(ChatsStart)
    ensureWritable(flags)
    const client = await createClient(flags)
    const accountID = flags.account ? await resolveAccountID(client, flags.account) : undefined
    await printData(await client.chats.start({ accountID, userID: args.user, title: flags.title } as any), flags.json ? 'json' : 'human')
  }
}
