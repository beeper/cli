import { createReadStream } from 'node:fs'
import { waitForMessage } from './wait.js'

export async function sendMessage(client: any, options: {
  chatID: string
  file?: string
  fileName?: string
  mimeType?: string
  replyTo?: string
  text: string
  mentions?: string[]
  noPreview?: boolean
  wait?: boolean
  waitTimeoutMs?: number
}): Promise<unknown> {
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
        duration: uploaded.duration,
        fileName: uploaded.fileName,
        mimeType: uploaded.mimeType,
        size: uploaded.width && uploaded.height ? { height: uploaded.height, width: uploaded.width } : undefined,
      }
      : undefined,
    replyToMessageID: options.replyTo,
    text: options.text,
    mentions: options.mentions?.length ? options.mentions : undefined,
    disableLinkPreview: options.noPreview || undefined,
  })

  if (!options.wait) return pending
  return waitForMessage(client, options.chatID, pending.pendingMessageID, {
    timeoutMs: options.waitTimeoutMs,
  })
}
