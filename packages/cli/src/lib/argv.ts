export function splitCommandLine(input: string): string[] {
  const tokens: string[] = []
  let current = ''
  let tokenStarted = false
  let quote: '"' | "'" | undefined
  let escaped = false

  for (const char of input) {
    if (escaped) {
      current += char
      tokenStarted = true
      escaped = false
      continue
    }

    if (char === '\\' && quote !== "'") {
      escaped = true
      continue
    }

    if ((char === '"' || char === "'") && (!quote || quote === char)) {
      if (!quote) tokenStarted = true
      quote = quote ? undefined : char
      continue
    }

    if (!quote && /\s/.test(char)) {
      if (tokenStarted) {
        tokens.push(current)
        current = ''
        tokenStarted = false
      }
      continue
    }

    current += char
    tokenStarted = true
  }

  if (escaped) {
    current += '\\'
    tokenStarted = true
  }
  if (quote) throw new Error(`Unclosed ${quote} quote`)
  if (tokenStarted) tokens.push(current)
  return tokens
}
