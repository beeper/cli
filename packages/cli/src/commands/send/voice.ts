import { Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printData, printDryRun } from '../../lib/output.js'
import { resolveChatID } from '../../lib/resolve.js'
import { sendMessage } from '../../lib/send-message.js'

export default class SendVoice extends BeeperCommand {
  static override summary = 'Send a voice note'
  static override description = 'Uploads the audio file and sends as a voice note. Defaults --mime to audio/ogg.'
  static override flags = {
    to: Flags.string({ required: true, description: 'Chat selector (ID, local ID, title, or search text)' }),
    file: Flags.string({ required: true, description: 'Voice note audio file (OGG/Opus recommended)' }),
    duration: Flags.integer({ description: 'Voice note duration in seconds (overrides upload-detected duration)' }),
    filename: Flags.string({ description: 'Override the displayed filename' }),
    mime: Flags.string({ default: 'audio/ogg', description: 'MIME type for the voice note (default: audio/ogg)' }),
    pick: Flags.integer({ description: 'Pick the Nth result when the selector is ambiguous (1-indexed)' }),
    'reply-to': Flags.string({ description: 'Send as a reply to this message ID' }),
    wait: Flags.boolean({ default: false, description: 'Wait for the message to leave the pending state (or fail) before returning' }),
    'wait-timeout': Flags.integer({ default: 30_000, description: 'Maximum wait time in ms when --wait is set' }),
  }
  async run(): Promise<void> {
    const { flags } = await this.parse(SendVoice)
    const dryRunRequest = {
      chat: flags.to,
      pick: flags.pick,
      file: flags.file,
      fileName: flags.filename,
      mimeType: flags.mime,
      replyTo: flags['reply-to'],
      text: '',
      attachmentType: 'voice-note' as const,
      duration: flags.duration,
      wait: flags.wait,
      waitTimeoutMs: flags['wait-timeout'],
    }
    if (flags['dry-run']) {
      await printDryRun('send.voice', dryRunRequest, flags.json ? 'json' : 'human')
      return
    }

    ensureWritable(flags)
    const client = await createClient(flags)
    const chatID = await resolveChatID(client, flags.to, { pick: flags.pick })
    await printData(
      await sendMessage(client, { ...dryRunRequest, chatID }),
      flags.json ? 'json' : 'human',
    )
  }
}
