#!/usr/bin/env bun
import payloadArchive from '../dist/binary-payload.tar.gz' with { type: 'file' }
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

void (async () => {
  const archive = await readFile(payloadArchive)
  const payloadHash = createHash('sha256').update(archive).digest('hex').slice(0, 16)
  const cacheRoot = process.env.BEEPER_CLI_BINARY_CACHE_DIR || join(homedir(), '.cache', 'beeper-cli', 'binary')
  const payloadRoot = join(cacheRoot, payloadHash)
  const entrypoint = join(payloadRoot, 'bin', 'run.js')

  if (!existsSync(entrypoint)) {
    const tempArchive = join(tmpdir(), `beeper-cli-${payloadHash}.tar.gz`)
    await mkdir(dirname(tempArchive), { recursive: true })
    await mkdir(payloadRoot, { recursive: true })
    await Bun.write(tempArchive, archive)
    await run('tar', ['-xzf', tempArchive, '-C', payloadRoot])
  }

  const child = Bun.spawn([process.execPath, entrypoint, ...process.argv.slice(2)], {
    env: {
      ...process.env,
      BUN_BE_BUN: '1',
    },
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  })

  const code = await child.exited
  if (child.signalCode) process.kill(process.pid, child.signalCode)
  process.exit(code ?? 1)
})()

async function run(command, args) {
  const child = Bun.spawn([command, ...args], {
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  })
  const code = await child.exited
  if (code !== 0) throw new Error(`${command} ${args.join(' ')} exited with ${code}`)
}
