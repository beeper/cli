import { Command } from '@oclif/core'
import { createInterface } from 'node:readline/promises'
import { stdin as input } from 'node:process'
import { splitCommandLine } from '../lib/argv.js'
import { runCli } from '../lib/runner.js'

type RPCRequest = {
  args?: string[]
  argv?: string[]
  command?: string
  id?: string | number | null
}

export default class RPC extends Command {
  static override summary = 'Run newline-delimited JSON command RPC'
  static override description = 'Reads JSON lines like {"id":1,"command":"send CHAT hello"} or {"id":1,"args":["status","--json"]}.'

  async run(): Promise<void> {
    const rl = createInterface({ input })

    for await (const line of rl) {
      if (!line.trim()) continue

      try {
        const request = JSON.parse(line) as RPCRequest
        const args = normalizeArgs(request)
        if (args[0] === 'rpc' || args[0] === 'shell') throw new Error(`Unsupported nested command: ${args[0]}`)
        const result = await runCli(args)
        process.stdout.write(`${JSON.stringify({
          id: request.id ?? null,
          ok: result.code === 0,
          code: result.code,
          signal: result.signal,
          stdout: result.stdout,
          stderr: result.stderr,
        })}\n`)
      } catch (error) {
        process.stdout.write(`${JSON.stringify({
          id: null,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        })}\n`)
      }
    }
  }
}

function normalizeArgs(request: RPCRequest): string[] {
  const args = request.args ?? request.argv ?? (request.command ? splitCommandLine(request.command) : undefined)
  if (!args || args.length === 0) throw new Error('Expected args, argv, or command')
  return args
}
