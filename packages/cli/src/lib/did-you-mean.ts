import { createInterface, Interface } from 'node:readline'
import { CLIError, ExitCodes } from './errors.js'

export type Suggestion<T> = { value: T; label: string; distance: number }

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  const matrix: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) matrix[0]![j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1,
        matrix[i]![j - 1]! + 1,
        matrix[i - 1]![j - 1]! + cost,
      )
    }
  }
  return matrix[a.length]![b.length]!
}

export function rankSuggestions<T>(query: string, items: T[], labelOf: (item: T) => string | undefined, max = 3): Suggestion<T>[] {
  const q = query.trim().toLowerCase()
  const scored: Suggestion<T>[] = []
  for (const item of items) {
    const label = labelOf(item)
    if (!label) continue
    const l = label.toLowerCase()
    const dist = Math.min(
      levenshtein(q, l),
      l.includes(q) ? Math.max(0, l.length - q.length) : Infinity,
    )
    if (Number.isFinite(dist)) scored.push({ value: item, label, distance: dist })
  }
  scored.sort((a, b) => a.distance - b.distance || a.label.length - b.label.length)
  const cutoff = Math.max(3, Math.ceil(q.length * 0.6))
  return scored.filter(s => s.distance <= cutoff).slice(0, max)
}

export async function confirmSuggestion(prompt: string, options: { timeoutMs?: number; assumeYes?: boolean } = {}): Promise<boolean> {
  if (options.assumeYes) return true
  if (!process.stdin.isTTY || !process.stderr.isTTY) return false
  const rl: Interface = createInterface({ input: process.stdin, output: process.stderr })
  return new Promise<boolean>(resolve => {
    let resolved = false
    const finish = (value: boolean): void => {
      if (resolved) return
      resolved = true
      rl.close()
      resolve(value)
    }
    const timer = options.timeoutMs ? setTimeout(() => finish(true), options.timeoutMs) : undefined
    rl.question(`${prompt} [Y/n] `, answer => {
      if (timer) clearTimeout(timer)
      const a = answer.trim().toLowerCase()
      finish(a === '' || a === 'y' || a === 'yes')
    })
  })
}

export function declineWithExit127(message: string): never {
  throw new CLIError(message, ExitCodes.CommandNotFound)
}
