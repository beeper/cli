import { createHash, randomBytes } from 'node:crypto'

export type PKCEPair = {
  codeChallenge: string
  codeVerifier: string
}

export function createPKCEPair(): PKCEPair {
  const codeVerifier = randomBytes(64).toString('base64url')
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url')
  return { codeChallenge, codeVerifier }
}

export function createState(): string {
  return randomBytes(24).toString('base64url')
}
