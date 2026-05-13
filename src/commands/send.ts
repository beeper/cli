import { Args, Command, Flags } from '@oclif/core'
import { createReadStream } from 'node:fs'
import { createClient } from '../lib/client.js'
import { printData } from '../lib/output.js'
import { resolveChatID } from '../lib/resolve.js'
import { waitForMessage } from '../lib/wait.js'

export default class Send extends Command {
  static override summary = 'Send a text message to a chat'
  static override args = {
    chat: Args.string({ description: 'Chat ID, local chat ID, title, or search text', required: true }),
    text: Args.string({ description: 'Message text', required: true }),
  }
  static override flags = {
    'base-url': Flags.string({ description: 'Beeper Desktop API base URL' }),
    debug: Flags.boolean({ default: false }),
    file: Flags.string({ description: 'File attachment to upload and send' }),
    'file-name': Flags.string({ description: 'Attachment display filename' }),
    json: Flags.boolean({ default: false, description: 'Print JSON' }),
    'mime-type': Flags.string({ description: 'Attachment MIME type' }),
    pick: Flags.integer({ description: 'Pick the Nth chat when the input is ambiguous' }),
    'reply-to': Flags.string({ description: 'Reply to message ID' }),
    wait: Flags.boolean({ default: false, description: 'Wait for the pending message to resolve' }),
    'wait-interval': Flags.integer({ default: 750, description: 'Milliseconds between message status checks' }),
    'wait-timeout': Flags.integer({ default: 30000, description: 'Milliseconds to wait for message resolution' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Send)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, args.chat, { pick: flags.pick })
    const attachment = flags.file
      ? await client.assets.upload({
        file: createReadStream(flags.file),
        fileName: flags['file-name'],
        mimeType: flags['mime-type'],
      })
      : undefined
    const result = await client.messages.send(chatID, {
      attachment: attachment?.uploadID
        ? {
          uploadID: attachment.uploadID,
          duration: attachment.duration,
          fileName: attachment.fileName,
          mimeType: attachment.mimeType,
          size: attachment.width && attachment.height ? { height: attachment.height, width: attachment.width } : undefined,
        }
        : undefined,
      replyToMessageID: flags['reply-to'],
      text: args.text,
    })
    if (flags.wait) {
      const resolved = await waitForMessage(client, chatID, result.pendingMessageID, {
        intervalMs: flags['wait-interval'],
        timeoutMs: flags['wait-timeout'],
      })
      printData(resolved, flags.json ? 'json' : 'human')
      return
    }
    printData(result, flags.json ? 'json' : 'human')
  }
}
