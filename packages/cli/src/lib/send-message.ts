import { createReadStream } from 'node:fs'
import { resolveAccountID, resolveChatID, userQueryFromInput } from './resolve.js'
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

export async function resolveSendChatID(client: any, options: {
  to: string
  pick?: number
  account?: string
}): Promise<string> {
  if (!options.account) return resolveChatID(client, options.to, { pick: options.pick })

  const accountID = await resolveAccountID(client, options.account)
  const chat = await client.chats.start({
    accountID,
    user: userQueryFromInput(options.to),
  })
  // Explicit account selection must not silently send through another network.
  if (String(chat?.accountID ?? '') !== accountID) {
    throw new Error('Could not verify the resolved direct chat belongs to the selected account; refusing to send.')
  }
  const chatID = chat?.localChatID ?? chat?.id ?? chat?.chatID
  if (!chatID) throw new Error('Starting the direct chat did not return a chat ID')
  return String(chatID)
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
