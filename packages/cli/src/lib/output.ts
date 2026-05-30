import type { StreamController, Suggestion } from './ink/render.js'

export type OutputFormat = 'human' | 'json' | 'jsonl' | 'table' | 'text' | 'ids'
type RecordValue = Record<string, unknown>

const writeJSON = (value: unknown, format: 'json' | 'jsonl'): void => {
  process.stdout.write(`${JSON.stringify(value, null, format === 'json' ? 2 : 0)}\n`)
}

const envelope = (data: unknown, meta: Record<string, unknown> = {}) => ({ ok: true, data, error: null, meta })

const loadInk = () => import('./ink/render.js')

export async function printData(value: unknown, format: OutputFormat): Promise<void> {
  format = effectiveFormat(format)
  if (format === 'ids') {
    printIDs(Array.isArray(value) ? value : [value])
    return
  }
  if (format === 'json') {
    writeJSON(jsonPayload(value), 'json')
    return
  }
  if (format === 'jsonl') {
    value = projectJSON(value)
    if (Array.isArray(value)) {
      for (const item of value) process.stdout.write(`${JSON.stringify(item)}\n`)
      return
    }
    process.stdout.write(`${JSON.stringify(value)}\n`)
    return
  }
  if (format === 'text') {
    printText(value)
    return
  }
  const { renderValue } = await loadInk()
  await renderValue(value)
}

export async function printDryRun(action: string, request: Record<string, unknown>, format: OutputFormat): Promise<void> {
  await printData({ dryRun: true, action, request }, format)
}

export async function printList(
  value: unknown[],
  format: OutputFormat,
  empty: { title: string; subtitle?: string; suggestions?: Suggestion[] },
): Promise<void> {
  format = effectiveFormat(format)
  if (format === 'ids') {
    printIDs(value)
    return
  }
  if (format === 'json') {
    writeJSON(jsonPayload(value), 'json')
    return
  }
  if (format === 'jsonl') {
    const projected = projectJSON(value)
    for (const item of Array.isArray(projected) ? projected : [projected]) process.stdout.write(`${JSON.stringify(item)}\n`)
    return
  }
  if (format === 'text') {
    printText(value)
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
    const id = record.localChatID ?? record.rowID ?? record.id ?? record.chatID ?? record.messageID
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
  format = effectiveFormat(format)
  if (format === 'json' || format === 'jsonl') {
    writeJSON(jsonPayload({ message: opts.message, detail: opts.detail, entity: opts.entity, ...(opts.data ?? {}) }), format)
    return
  }
  if (format === 'ids') {
    printIDs([opts.entity ?? opts.data ?? {}])
    return
  }
  if (format === 'text') {
    process.stdout.write(`${opts.message}${opts.detail ? `\t${opts.detail}` : ''}\n`)
    return
  }
  if (process.env.BEEPER_QUIET === '1') return
  const { renderSuccess } = await loadInk()
  await renderSuccess(opts)
}

export async function printFailure(
  opts: { message: string; detail?: string; data?: Record<string, unknown> },
  format: OutputFormat,
): Promise<void> {
  format = effectiveFormat(format)
  if (format === 'json' || format === 'jsonl') {
    writeJSON({ ok: false, data: opts.data ?? null, error: { message: opts.message, detail: opts.detail } }, format)
    return
  }
  const { renderFailure } = await loadInk()
  await renderFailure(opts)
}

export async function printConfig(data: Record<string, unknown>, format: OutputFormat): Promise<void> {
  format = effectiveFormat(format)
  if (format === 'json' || format === 'jsonl') {
    writeJSON(jsonPayload(data), format)
    return
  }
  if (format === 'ids') {
    printIDs([data])
    return
  }
  if (format === 'text') {
    printText(data)
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
  format = effectiveFormat(format)
  if (format === 'json' || format === 'jsonl') {
    writeJSON(jsonPayload(items, opts ? { title: opts.title } : {}), format)
    return
  }
  if (format === 'ids') {
    for (const item of items) process.stdout.write(`${item.command}\n`)
    return
  }
  if (format === 'text') {
    for (const item of items) process.stdout.write(`${item.command}\t${item.description}\n`)
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

export function isMachineReadableOutput(format?: OutputFormat): boolean {
  const effective = effectiveFormat(format ?? 'human')
  return effective === 'json' || effective === 'jsonl' || effective === 'ids' || effective === 'text'
}

function effectiveFormat(format: OutputFormat): OutputFormat {
  const env = process.env.BEEPER_OUTPUT_FORMAT as OutputFormat | undefined
  if (env && ['json', 'jsonl', 'table', 'text', 'ids'].includes(env)) return env === 'table' ? 'human' : env
  return format === 'table' ? 'human' : format
}

function jsonPayload(value: unknown, meta: Record<string, unknown> = {}): unknown {
  const projected = projectJSON(value)
  if (process.env.BEEPER_OUTPUT_RESULTS_ONLY === '1') return unwrapPrimary(projected)
  return envelope(projected, meta)
}

function projectJSON(value: unknown): unknown {
  const fields = (process.env.BEEPER_OUTPUT_SELECT ?? '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
  let output = value
  if (process.env.BEEPER_OUTPUT_RESULTS_ONLY === '1') output = unwrapPrimary(output)
  if (!fields.length) return output
  return selectFields(output, fields)
}

function unwrapPrimary(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value
  const record = value as Record<string, unknown>
  if ('items' in record) return record.items
  if ('results' in record) return record.results
  if ('data' in record) return record.data
  const metaKeys = new Set(['nextCursor', 'nextPageToken', 'cursor', 'hasMore', 'count', 'query'])
  const keys = Object.keys(record).filter(key => !metaKeys.has(key))
  if (keys.length === 1) return record[keys[0]!]
  return value
}

function selectFields(value: unknown, fields: string[]): unknown {
  if (Array.isArray(value)) return value.map(item => selectFields(item, fields))
  if (!value || typeof value !== 'object') return value
  const out: Record<string, unknown> = {}
  for (const field of fields) {
    const selected = selectPath(value, field.split('.'))
    if (selected !== undefined) mergeSelected(out, selected)
  }
  return out
}

function selectPath(value: unknown, parts: string[]): unknown {
  if (!parts.length) return value
  if (Array.isArray(value)) {
    const items = value.map(item => selectPath(item, parts)).filter(item => item !== undefined)
    return items.length ? items : undefined
  }
  if (!value || typeof value !== 'object') return undefined
  const [part, ...rest] = parts
  if (!part) return undefined
  const child = (value as Record<string, unknown>)[part]
  if (child === undefined) return undefined
  const selected = selectPath(child, rest)
  return selected === undefined ? undefined : { [part]: selected }
}

function mergeSelected(target: Record<string, unknown>, selected: unknown): void {
  if (!selected || typeof selected !== 'object' || Array.isArray(selected)) return
  for (const [key, value] of Object.entries(selected as Record<string, unknown>)) {
    const current = target[key]
    if (Array.isArray(value)) {
      const currentItems = Array.isArray(current) ? current : []
      target[key] = value.map((item, index) => {
        const base = currentItems[index]
        if (item && typeof item === 'object' && !Array.isArray(item) && base && typeof base === 'object' && !Array.isArray(base)) {
          return mergeObjects(base as Record<string, unknown>, item as Record<string, unknown>)
        }
        return item
      })
    } else if (value && typeof value === 'object' && !Array.isArray(value) && current && typeof current === 'object' && !Array.isArray(current)) {
      target[key] = mergeObjects(current as Record<string, unknown>, value as Record<string, unknown>)
    } else {
      target[key] = value
    }
  }
}

function mergeObjects(left: Record<string, unknown>, right: Record<string, unknown>): Record<string, unknown> {
  const out = { ...left }
  mergeSelected(out, right)
  return out
}

function printText(value: unknown): void {
  if (Array.isArray(value)) {
    for (const item of value) printText(item)
    return
  }
  if (!value || typeof value !== 'object') {
    if (value !== undefined) process.stdout.write(`${String(value)}\n`)
    return
  }
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (item == null) continue
    process.stdout.write(`${key}\t${typeof item === 'object' ? JSON.stringify(item) : String(item)}\n`)
  }
}
