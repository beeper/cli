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
    stdio: [options.inherit ? 'inherit' : 'ignore', options.inherit ? 'inherit' : 'pipe', options.inherit ? 'inherit' : 'pipe'],
  })

  const waitForExit = new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve, reject) => {
    child.once('error', reject)
    child.once('exit', (code, signal) => resolve({ code, signal }))
  })

  if (options.inherit) {
    const { code, signal } = await waitForExit
    return { code, signal, stdout: '', stderr: '' }
  }

  const [stdout, stderr, exit] = await Promise.all([
    streamToString(child.stdout),
    streamToString(child.stderr),
    waitForExit,
  ])
  return { code: exit.code, signal: exit.signal, stdout, stderr }
}

async function streamToString(stream: NodeJS.ReadableStream | null): Promise<string> {
  if (!stream) return ''
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)))
  return Buffer.concat(chunks).toString('utf8')
}
