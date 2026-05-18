import { createReadStream } from 'node:fs'
import { waitForMessage } from './wait.js'

export type AttachmentType = 'sticker' | 'voice-note'
export type SendMessageResult = {
  accepted: boolean
  state: 'accepted' | 'resolved'
  chatID: string
  pendingMessageID?: string
  message?: unknown
  hint?: string
}

export async function sendMessage(client: any, options: {
  chatID: string
  file?: string
  fileName?: string
  mimeType?: string
  replyTo?: string
  text: string
  mentions?: string[]
  noPreview?: boolean
  attachmentType?: AttachmentType
  duration?: number
  wait?: boolean
  waitTimeoutMs?: number
}): Promise<SendMessageResult> {
  const uploaded = options.file
    ? await client.assets.upload({
      file: createReadStream(options.file),
      fileName: options.fileName,
      mimeType: options.mimeType,
    })
    : undefined

  if (options.file && !uploaded?.uploadID) throw new Error('Upload did not return an uploadID')

  const pending = await client.messages.send(options.chatID, {
    attachment: uploaded?.uploadID
      ? {
        uploadID: uploaded.uploadID,
        type: options.attachmentType,
        duration: options.duration ?? uploaded.duration,
        fileName: uploaded.fileName,
        mimeType: options.mimeType ?? uploaded.mimeType,
        size: uploaded.width && uploaded.height ? { height: uploaded.height, width: uploaded.width } : undefined,
      }
      : undefined,
    replyToMessageID: options.replyTo,
    text: options.text,
    mentions: options.mentions?.length ? options.mentions : undefined,
    disableLinkPreview: options.noPreview || undefined,
  })

  if (!options.wait) {
    return {
      ...pending,
      accepted: true,
      state: 'accepted',
      chatID: options.chatID,
      hint: 'Desktop accepted the send request. Pass --wait to wait for the final message or failure.',
    }
  }
  const message = await waitForMessage(client, options.chatID, pending.pendingMessageID, {
    timeoutMs: options.waitTimeoutMs,
  })
  return {
    accepted: true,
    state: 'resolved',
    chatID: options.chatID,
    pendingMessageID: pending.pendingMessageID,
    message,
  }
}
