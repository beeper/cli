import type { StreamController, Suggestion } from './ink/render.js'

export type OutputFormat = 'human' | 'json' | 'jsonl'
type RecordValue = Record<string, unknown>

const writeJSON = (value: unknown, format: 'json' | 'jsonl'): void => {
  process.stdout.write(`${JSON.stringify(value, null, format === 'json' ? 2 : 0)}\n`)
}

const loadInk = () => import('./ink/render.js')

export async function printData(value: unknown, format: OutputFormat): Promise<void> {
  if (format === 'json') {
    writeJSON(value, 'json')
    return
  }
  if (format === 'jsonl') {
    if (Array.isArray(value)) {
      for (const item of value) process.stdout.write(`${JSON.stringify(item)}\n`)
      return
    }
    process.stdout.write(`${JSON.stringify(value)}\n`)
    return
  }
  const { renderValue } = await loadInk()
  await renderValue(value)
}

export async function printList(
  value: unknown[],
  format: OutputFormat,
  empty: { title: string; subtitle?: string; suggestions?: Suggestion[] },
): Promise<void> {
  if (format === 'json') {
    writeJSON(value, 'json')
    return
  }
  if (format === 'jsonl') {
    for (const item of value) process.stdout.write(`${JSON.stringify(item)}\n`)
    return
  }
  const { renderList } = await loadInk()
  await renderList(value as RecordValue[], empty)
}

export async function collectPage<T>(iterable: AsyncIterable<T>, limit?: number): Promise<T[]> {
  if (limit !== undefined && limit <= 0) return []
  const items: T[] = []
  for await (const item of iterable) {
    items.push(item)
    if (limit !== undefined && items.length >= limit) break
  }
  return items
}

export function printIDs(values: unknown[]): void {
  for (const value of values) {
    if (!value || typeof value !== 'object') continue
    const record = value as Record<string, unknown>
    const id = record.id ?? record.chatID ?? record.messageID
    if (id) process.stdout.write(`${String(id)}\n`)
  }
}

export async function emptyState(opts: { title: string; subtitle?: string; suggestions?: Suggestion[] }): Promise<void> {
  const { renderEmptyState } = await loadInk()
  await renderEmptyState(opts)
}

export async function printSuccess(
  opts: { message: string; detail?: string; entity?: unknown; data?: Record<string, unknown> },
  format: OutputFormat,
): Promise<void> {
  if (format === 'json' || format === 'jsonl') {
    writeJSON({ ok: true, message: opts.message, ...(opts.data ?? {}) }, format)
    return
  }
  const { renderSuccess } = await loadInk()
  await renderSuccess(opts)
}

export async function printFailure(
  opts: { message: string; detail?: string; data?: Record<string, unknown> },
  format: OutputFormat,
): Promise<void> {
  if (format === 'json' || format === 'jsonl') {
    writeJSON({ ok: false, message: opts.message, ...(opts.data ?? {}) }, format)
    return
  }
  const { renderFailure } = await loadInk()
  await renderFailure(opts)
}

export async function printConfig(data: Record<string, unknown>, format: OutputFormat): Promise<void> {
  if (format === 'json' || format === 'jsonl') {
    writeJSON(data, format)
    return
  }
  const { renderConfig } = await loadInk()
  await renderConfig(data)
}

export async function printCommands(
  items: Array<{ command: string; description: string; group?: string }>,
  format: OutputFormat,
  opts?: { title?: string; intro?: string[] },
): Promise<void> {
  if (format === 'json' || format === 'jsonl') {
    writeJSON(items, format)
    return
  }
  const { renderCommands } = await loadInk()
  await renderCommands(items, opts)
}

export async function startStream(opts: { baseURL: string; subscribed: string[] }): Promise<StreamController> {
  const { renderStream } = await loadInk()
  return renderStream(opts)
}

export type { Suggestion } from './ink/render.js'
