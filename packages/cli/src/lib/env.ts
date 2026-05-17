import { delimiter } from 'node:path'
import { binDir } from './installations.js'

export type ShellName = 'sh' | 'fish' | 'powershell'

export function isBeeperBinOnPath(pathValue = process.env.PATH ?? ''): boolean {
  return pathValue.split(delimiter).includes(binDir())
}

export function pathSetup(shell: ShellName): string {
  const dir = binDir()
  if (shell === 'fish') return `fish_add_path ${fishQuote(dir)}`
  if (shell === 'powershell') return `$env:Path = ${powershellQuote(`${dir};`)} + $env:Path`
  return `export PATH=${shQuote(dir)}:$PATH`
}

export function pathSetupHint(): string | undefined {
  if (isBeeperBinOnPath()) return undefined
  return `Add ${binDir()} to PATH: eval "$(beeper env)"`
}

function shQuote(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`
}

function fishQuote(value: string): string {
  return shQuote(value)
}

function powershellQuote(value: string): string {
  return `'${value.replaceAll("'", "''")}'`
}

