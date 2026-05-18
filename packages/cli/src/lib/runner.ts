export type RunResult = {
  code: number | null
  signal: NodeJS.Signals | null
  stdout: string
  stderr: string
}

export async function runCli(args: string[], options: { inherit?: boolean } = {}): Promise<RunResult> {
  const child = Bun.spawn([process.execPath, process.argv[1]!, ...args], {
    env: process.env,
    stdin: options.inherit ? 'inherit' : 'ignore',
    stdout: options.inherit ? 'inherit' : 'pipe',
    stderr: options.inherit ? 'inherit' : 'pipe',
  })

  if (options.inherit) {
    const code = await child.exited
    return { code, signal: child.signalCode as NodeJS.Signals | null, stdout: '', stderr: '' }
  }

  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ])
  return { code, signal: child.signalCode as NodeJS.Signals | null, stdout, stderr }
}
