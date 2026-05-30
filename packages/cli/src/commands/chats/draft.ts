import { Flags } from '@oclif/core'
import { createReadStream } from 'node:fs'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData, printDryRun, printSuccess } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'

export default class ChatsDraft extends BeeperCommand {
  static override summary = 'Set or clear a chat draft'
  static override flags = {
    chat: Flags.string({ required: true, description: 'Chat selector (ID, local ID, title, or search text)' }),
    pick: Flags.integer({ description: 'Pick the Nth result when the selector is ambiguous (1-indexed)' }),
    text: Flags.string({ description: 'Draft text. Omit and pass --clear to remove the draft.' }),
    file: Flags.string({ description: 'Attachment file to upload with the draft' }),
    filename: Flags.string({ description: 'Override the displayed filename of the attachment' }),
    mime: Flags.string({ description: 'Override MIME type detection for the attachment' }),
    clear: Flags.boolean({ default: false, description: 'Clear the existing draft instead of setting one' }),
  }
  async run(): Promise<void> {
    const { flags } = await this.parse(ChatsDraft)
    ensureWritable(flags)
    if (!flags.clear && flags.text === undefined) throw new Error('Provide --text TEXT (and optionally --file PATH) or --clear.')
    if (flags.clear && (flags.text !== undefined || flags.file)) throw new Error('--clear cannot be combined with --text or --file.')
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.chat, { pick: flags.pick })
    if (flags.clear) {
      if (flags['dry-run']) {
        await printDryRun('chats.draft', { chatID, draft: null }, flags.json ? 'json' : 'human')
        return
      }
      await printData(await client.chats.update(chatID, { draft: null }), flags.json ? 'json' : 'human')
      return
    }
    if (flags['dry-run']) {
      await printDryRun('chats.draft', { chatID, draft: { text: flags.text!, file: flags.file, fileName: flags.filename, mimeType: flags.mime } }, flags.json ? 'json' : 'human')
      return
    }
    const upload = flags.file ? await client.assets.upload({ file: createReadStream(flags.file), fileName: flags.filename, mimeType: flags.mime }) : undefined
    await printData(await client.chats.update(chatID, { draft: { text: flags.text!, attachments: upload?.uploadID ? { [upload.uploadID]: upload as any } : undefined } }), flags.json ? 'json' : 'human')
  }
}
