import { Command, Flags } from '@oclif/core'
import { createClient } from '../lib/client.js'
import { printData } from '../lib/output.js'
import { resolveAccountID } from '../lib/resolve.js'

export default class CreateChat extends Command {
  static override summary = 'Create a direct or group chat from participant IDs'
  static override flags = {
    account: Flags.string({ description: 'Account ID, network, bridge, or account user', required: true }),
    'base-url': Flags.string({ description: 'Beeper Desktop API base URL' }),
    debug: Flags.boolean({ default: false }),
    json: Flags.boolean({ default: false, description: 'Print JSON' }),
    message: Flags.string({ description: 'Optional first message' }),
    participant: Flags.string({ multiple: true, required: true, description: 'Participant user ID' }),
    title: Flags.string({ description: 'Group title' }),
    type: Flags.string({ default: 'single', options: ['single', 'group'], description: 'Chat type' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(CreateChat)
    const client = await createClient(flags)
    const accountID = await resolveAccountID(client, flags.account)
    const result = await client.chats.create({
      accountID,
      messageText: flags.message,
      participantIDs: flags.participant,
      title: flags.title,
      type: flags.type as 'single' | 'group',
    })
    printData(result, flags.json ? 'json' : 'human')
  }
}
