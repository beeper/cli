#!/usr/bin/env bun
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const outDir = join(root, 'dist', 'bin')
const entrypoint = join(root, 'bin', 'run.js')
const targets = (process.env.BEEPER_BINARY_TARGETS || [
  'bun-darwin-arm64',
  'bun-darwin-x64',
  'bun-linux-arm64',
  'bun-linux-x64',
].join(',')).split(',').map(target => target.trim()).filter(Boolean)

await mkdir(outDir, { recursive: true })

const artifacts = []
for (const target of targets) {
  const platform = target.replace(/^bun-/, '')
  const outfile = join(outDir, platform.startsWith('windows-') ? `beeper-${platform}.exe` : `beeper-${platform}`)
  const result = await Bun.build({
    entrypoints: [entrypoint],
    compile: {
      outfile,
      target,
    },
    minify: true,
    sourcemap: 'linked',
    bytecode: true,
  })

  if (!result.success) {
    for (const log of result.logs) console.error(log)
    throw new Error(`Failed to build ${target}`)
  }

  const sha256 = await hashFile(outfile)
  artifacts.push({ file: basename(outfile), path: outfile, platform, sha256, target })
  console.log(`${outfile}`)
  console.log(`sha256 ${sha256}`)
}

await writeFile(
  join(outDir, 'binaries.json'),
  `${JSON.stringify({ command: 'beeper', package: pkg.name, version: pkg.version, artifacts }, null, 2)}\n`,
)

async function hashFile(path) {
  const hash = createHash('sha256')
  hash.update(await readFile(path))
  return hash.digest('hex')
}
