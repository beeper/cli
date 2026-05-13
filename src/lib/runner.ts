import { spawn } from 'node:child_process'

export type RunResult = {
  code: number | null
  signal: NodeJS.Signals | null
  stdout: string
  stderr: string
}

export async function runCli(args: string[], options: { inherit?: boolean } = {}): Promise<RunResult> {
  const child = spawn(process.execPath, [process.argv[1]!, ...args], {
    env: process.env,
    stdio: options.inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'],
  })

  if (options.inherit) {
    return new Promise((resolve, reject) => {
      child.on('error', reject)
      child.on('close', (code, signal) => resolve({ code, signal, stdout: '', stderr: '' }))
    })
  }

  let stdout = ''
  let stderr = ''
  child.stdout?.setEncoding('utf8')
  child.stderr?.setEncoding('utf8')
  child.stdout?.on('data', chunk => {
    stdout += chunk
  })
  child.stderr?.on('data', chunk => {
    stderr += chunk
  })

  return new Promise((resolve, reject) => {
    child.on('error', reject)
    child.on('close', (code, signal) => resolve({ code, signal, stdout, stderr }))
  })
}
