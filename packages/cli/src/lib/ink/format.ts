export type RecordValue = Record<string, unknown>

export function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

export function compact(values: unknown[]): string[] {
  return values.filter((value): value is string => typeof value === 'string' && value.length > 0)
}

export function formatTime(value: unknown): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return String(value)
  const now = Date.now()
  const diffMs = now - date.valueOf()
  const abs = Math.abs(diffMs)
  const suffix = diffMs >= 0 ? 'ago' : 'from now'
  if (abs < 60_000) return 'just now'
  if (abs < 3_600_000) return `${Math.round(abs / 60_000)}m ${suffix}`
  if (abs < 86_400_000) return `${Math.round(abs / 3_600_000)}h ${suffix}`
  if (abs < 604_800_000) return `${Math.round(abs / 86_400_000)}d ${suffix}`
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  })
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function formatDuration(ms: number): string {
  const seconds = Math.round(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${minutes}m ${remainder}s`
}

export function shortID(value: string): string {
  const local = value.split(':')[0]
  return local?.replace(/^@/, '') || value
}

export function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`
}

export function cleanText(value: unknown): string | undefined {
  const raw = stringValue(value)
  if (!raw) return undefined
  const text = raw
    .replace(/<[^>]*>/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`~>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return text ? truncate(text, 240) : undefined
}

export function attachmentLabel(attachments: unknown[]): string {
  const labels = attachments.map(item => {
    if (!item || typeof item !== 'object') return 'attachment'
    const attachment = item as RecordValue
    return stringValue(attachment.fileName) ?? stringValue(attachment.type) ?? 'attachment'
  })
  return labels.length === 1 ? labels[0]! : `${labels.length} attachments`
}

export function messageText(message: RecordValue): string | undefined {
  if (message.isDeleted) return 'deleted message'
  const text = cleanText(message.text)
  if (text) return text
  if (Array.isArray(message.attachments) && message.attachments.length > 0) return attachmentLabel(message.attachments)
  if (Array.isArray(message.links) && message.links.length > 0) return `${message.links.length} link${message.links.length === 1 ? '' : 's'}`
  return undefined
}

export function chatPreview(chat: RecordValue): { kind: 'draft' | 'message'; sender?: string; text: string } | undefined {
  if (chat.draft && typeof chat.draft === 'object') {
    const draft = chat.draft as RecordValue
    const text = cleanText(draft.text) ?? ''
    return { kind: 'draft', text }
  }
  const lastMessage = (chat.latestMessage ?? chat.lastMessage) as RecordValue | undefined
  if (lastMessage && typeof lastMessage === 'object') {
    const sender = stringValue(lastMessage.senderName) ?? (lastMessage.isSender ? 'you' : undefined)
    const text = messageText(lastMessage) ?? ''
    if (!text && !sender) return undefined
    return { kind: 'message', sender, text }
  }
  return undefined
}

export function participantsSummary(participants: RecordValue): string | undefined {
  const total = participants.total
  const items = Array.isArray(participants.items) ? participants.items : []
  if (typeof total === 'number') return `${total} participant${total === 1 ? '' : 's'}`
  if (items.length) return `${items.length} participant${items.length === 1 ? '' : 's'}`
  return undefined
}

export function isPinned(chat: RecordValue): boolean {
  return Boolean(chat.isPinned ?? chat.pinned)
}

export function isMuted(chat: RecordValue): boolean {
  return Boolean(chat.isMuted ?? chat.muted)
}

export function isArchived(chat: RecordValue): boolean {
  return Boolean(chat.isArchived ?? chat.archived)
}

export function isLowPriority(chat: RecordValue): boolean {
  return Boolean(chat.isLowPriority ?? chat.lowPriority)
}
