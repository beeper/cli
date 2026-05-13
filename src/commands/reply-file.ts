import { Args, Command, Flags } from '@oclif/core'
import { createReadStream } from 'node:fs'
import { createClient } from '../lib/client.js'
import { apiCopy, cliCopy, sdkParamCopy } from '../lib/copy.js'
import { printData } from '../lib/output.js'
import { resolveChatID } from '../lib/resolve.js'
import { waitForMessage } from '../lib/wait.js'

export default class ReplyFile extends Command {
  static override summary = apiCopy.messages.send
  static override args = {
    chat: Args.string({ description: cliCopy.args.chatSelector, required: true }),
    message: Args.string({ description: sdkParamCopy.replyToMessageID, required: true }),
    file: Args.string({ description: sdkParamCopy.attachmentFile, required: true }),
    text: Args.string({ description: sdkParamCopy.text, required: false }),
  }
  static override flags = {
    'base-url': Flags.string({ description: cliCopy.flags.baseURL }),
    debug: Flags.boolean({ default: false }),
    'file-name': Flags.string({ description: sdkParamCopy.fileName }),
    json: Flags.boolean({ default: false, description: cliCopy.flags.json }),
    'mime-type': Flags.string({ description: sdkParamCopy.mimeType }),
    pick: Flags.integer({ description: cliCopy.flags.pick }),
    wait: Flags.boolean({ default: false, description: 'Wait for the pending message to resolve' }),
    'wait-interval': Flags.integer({ default: 750, description: 'Milliseconds between message status checks' }),
    'wait-timeout': Flags.integer({ default: 30000, description: 'Milliseconds to wait for message resolution' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ReplyFile)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, args.chat, { pick: flags.pick })
    const attachment = await client.assets.upload({
      file: createReadStream(args.file),
      fileName: flags['file-name'],
      mimeType: flags['mime-type'],
    })
    if (!attachment.uploadID) throw new Error('Upload did not return an uploadID')
    const uploadID = attachment.uploadID
    const result = await client.messages.send(chatID, {
      attachment: {
        uploadID,
        duration: attachment.duration,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        size: attachment.width && attachment.height ? { height: attachment.height, width: attachment.width } : undefined,
      },
      replyToMessageID: args.message,
      text: args.text || '',
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
