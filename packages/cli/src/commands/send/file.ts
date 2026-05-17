import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'
import { sendMessage } from '../../lib/send-message.js'

export default class SendFile extends BeeperCommand {
  static override summary = 'Send a file'
  static override flags = { to: Flags.string({ required: true }), file: Flags.string({ required: true }), caption: Flags.string(), 'file-name': Flags.string(), 'mime-type': Flags.string(), pick: Flags.integer(), 'reply-to': Flags.string(), wait: Flags.boolean({ default: false }), 'wait-interval': Flags.integer({ default: 750 }), 'wait-timeout': Flags.integer({ default: 30000 }) }
  async run(): Promise<void> {
    const { flags } = await this.parse(SendFile)
    ensureWritable(flags)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.to, { pick: flags.pick })
    await printData(await sendMessage(client, { chatID, file: flags.file, fileName: flags['file-name'], mimeType: flags['mime-type'], replyTo: flags['reply-to'], text: flags.caption || '', wait: flags.wait, waitIntervalMs: flags['wait-interval'], waitTimeoutMs: flags['wait-timeout'] }), flags.json ? 'json' : 'human')
  }
}
