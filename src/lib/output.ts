export type OutputFormat = 'human' | 'json' | 'jsonl'

export function printData(value: unknown, format: OutputFormat): void {
  if (format === 'json') {
    process.stdout.write(`${JSON.stringify(value, null, 2)}\n`)
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

  if (Array.isArray(value)) {
    for (const item of value) printHuman(item)
    return
  }

  printHuman(value)
}

function printHuman(value: unknown): void {
  if (!value || typeof value !== 'object') {
    process.stdout.write(`${String(value)}\n`)
    return
  }

  const record = value as Record<string, unknown>
  const title = record.title ?? record.displayName ?? record.name ?? record.id ?? record.messageID
  if (title) process.stdout.write(`${String(title)}\n`)
  for (const [key, item] of Object.entries(record)) {
    if (item == null || key === 'title' || key === 'displayName' || key === 'name') continue
    if (typeof item === 'object') continue
    process.stdout.write(`  ${key}: ${String(item)}\n`)
  }
}

export async function collectPage<T>(iterable: AsyncIterable<T>, limit?: number): Promise<T[]> {
  const items: T[] = []
  for await (const item of iterable) {
    items.push(item)
    if (limit && items.length >= limit) break
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
