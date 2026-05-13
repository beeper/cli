export function splitCommandLine(input: string): string[] {
  const tokens: string[] = []
  let current = ''
  let quote: '"' | "'" | undefined
  let escaped = false

  for (const char of input) {
    if (escaped) {
      current += char
      escaped = false
      continue
    }

    if (char === '\\' && quote !== "'") {
      escaped = true
      continue
    }

    if ((char === '"' || char === "'") && (!quote || quote === char)) {
      quote = quote ? undefined : char
      continue
    }

    if (!quote && /\s/.test(char)) {
      if (current) {
        tokens.push(current)
        current = ''
      }
      continue
    }

    current += char
  }

  if (escaped) current += '\\'
  if (quote) throw new Error(`Unclosed ${quote} quote`)
  if (current) tokens.push(current)
  return tokens
}
