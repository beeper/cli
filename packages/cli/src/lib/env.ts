import { delimiter } from 'node:path'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'
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

export async function installPathSetup(shell: ShellName = detectShell()): Promise<{ path: string; line: string; changed: boolean }> {
  if (shell === 'powershell') throw new Error('PowerShell PATH persistence is not supported yet. Run: beeper env --shell powershell')
  const path = shellConfigPath(shell)
  const line = pathSetup(shell)
  const current = await readFile(path, 'utf8').catch(error => {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return ''
    throw error
  })
  if (current.includes(binDir())) return { path, line, changed: false }
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${current}${current.endsWith('\n') || current.length === 0 ? '' : '\n'}${line}\n`, 'utf8')
  return { path, line, changed: true }
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

function detectShell(): ShellName {
  return (process.env.SHELL ?? '').includes('fish') ? 'fish' : 'sh'
}

function shellConfigPath(shell: ShellName): string {
  if (shell === 'fish') return join(homedir(), '.config', 'fish', 'config.fish')
  return join(homedir(), (process.env.SHELL ?? '').includes('zsh') ? '.zshrc' : '.bashrc')
}
