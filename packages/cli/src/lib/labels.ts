import { ambiguous, notFound } from './errors.js'

export type LabelRecord = { id: string; name: string }

export async function listLabels(client: any): Promise<LabelRecord[]> {
  const response = await client.labels.list()
  return Array.isArray(response) ? response : (response?.items ?? [])
}

export async function resolveLabelID(client: any, input: string): Promise<string> {
  const labels = await listLabels(client)
  const normalized = input.trim().toLowerCase()
  const exact = labels.filter(label =>
    label.id.toLowerCase() === normalized || label.name.toLowerCase() === normalized
  )
  if (exact.length === 1) return exact[0]!.id
  if (exact.length > 1) {
    throw ambiguous(`Multiple labels match "${input}": ${exact.map(label => `${label.name} (${label.id})`).join(', ')}`)
  }

  const partial = labels.filter(label =>
    label.id.toLowerCase().includes(normalized) || label.name.toLowerCase().includes(normalized)
  )
  if (partial.length === 1) return partial[0]!.id
  if (partial.length > 1) {
    throw ambiguous(`Multiple labels match "${input}": ${partial.map(label => `${label.name} (${label.id})`).join(', ')}`)
  }

  throw notFound(`No label matches "${input}"`)
}
