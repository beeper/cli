import { setTimeout as sleep } from 'node:timers/promises'

export type WaitOptions = {
  intervalMs?: number
  timeoutMs?: number
}

export async function waitForMessage(client: any, chatID: string, pendingMessageID: string, options: WaitOptions = {}) {
  const started = Date.now()
  const timeoutMs = options.timeoutMs ?? 30_000
  const intervalMs = options.intervalMs ?? 750
  let lastError: unknown

  while (Date.now() - started < timeoutMs) {
    try {
      return await client.messages.retrieve(pendingMessageID, { chatID })
    } catch (error) {
      lastError = error
      await sleep(intervalMs)
    }
  }

  throw new Error(`Timed out waiting for ${pendingMessageID}${lastError instanceof Error ? `: ${lastError.message}` : ''}`)
}
