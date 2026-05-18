import { appRequest } from './app-api.js'
import { resolveTarget } from './targets.js'

type MatrixFlags = {
  'base-url'?: string
  target?: string
}

type MatrixContext = { homeserver: string; token: string }

export async function matrixContext(flags: MatrixFlags): Promise<MatrixContext> {
  const target = await resolveTarget({ target: flags.target, baseURL: flags['base-url'] })
  const token = process.env.BEEPER_ACCESS_TOKEN || target.auth?.accessToken
  if (!token) throw new Error('Matrix fallback requires stored target auth or BEEPER_ACCESS_TOKEN.')
  const state = await appRequest<{ matrix?: { homeserver?: string } }>('GET', '/v1/app/setup', {
    baseURL: flags['base-url'],
    target: flags.target,
    token,
  })
  const homeserver = state.matrix?.homeserver
  if (!homeserver) throw new Error('Matrix fallback could not determine the homeserver.')
  return { homeserver, token }
}

export async function createMatrixDM(flags: MatrixFlags, userID: string): Promise<{ room_id: string }> {
  return matrixRequest(await matrixContext(flags), 'POST', '/_matrix/client/v3/createRoom', {
    invite: [userID],
    is_direct: true,
    preset: 'trusted_private_chat',
  })
}

export async function sendMatrixText(flags: MatrixFlags, roomID: string, text: string): Promise<{ accepted: true; state: 'accepted'; chatID: string; pendingMessageID: string; hint: string }> {
  const txnID = `beeper-cli-${Date.now()}-${Math.random().toString(36).slice(2)}`
  await matrixRequest(await matrixContext(flags), 'PUT', `/_matrix/client/v3/rooms/${encodeURIComponent(roomID)}/send/m.room.message/${encodeURIComponent(txnID)}`, {
    body: text,
    msgtype: 'm.text',
  })
  return {
    accepted: true,
    state: 'accepted',
    chatID: roomID,
    pendingMessageID: txnID,
    hint: 'Matrix accepted the send request. Use messages show or watch to resolve the final event.',
  }
}

export async function listMatrixMessages(flags: MatrixFlags, roomID: string, limit: number): Promise<unknown[]> {
  const response = await matrixRequest<{ chunk?: unknown[] }>(await matrixContext(flags), 'GET', `/_matrix/client/v3/rooms/${encodeURIComponent(roomID)}/messages?dir=b&limit=${limit}`)
  return response.chunk ?? []
}

export function shouldFallbackToMatrix(chatID: string, error: unknown): boolean {
  if (!chatID.startsWith('!')) return false
  const message = error instanceof Error ? error.message : String(error)
  return /getChat|listMessages|sendMessage|Chat not found/i.test(message)
}

async function matrixRequest<T = any>(context: MatrixContext, method: 'GET' | 'POST' | 'PUT', path: string, body?: Record<string, unknown>): Promise<T> {
  const response = await fetch(new URL(path, context.homeserver), {
    method,
    headers: {
      authorization: `Bearer ${context.token}`,
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!response.ok) throw new Error(`${method} ${path} failed: ${response.status} ${await response.text()}`)
  return response.json() as Promise<T>
}
