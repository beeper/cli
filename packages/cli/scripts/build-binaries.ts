#!/usr/bin/env bun
import { createHash } from 'node:crypto'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const outDir = join(root, 'dist', 'bin')
const entrypoint = join(root, 'bin', 'binary-bootstrap.js')
const payloadArchive = join(root, 'dist', 'binary-payload.tar.gz')
const targets = (process.env.BEEPER_BINARY_TARGETS || [
  'bun-darwin-arm64',
  'bun-darwin-x64',
  'bun-linux-arm64',
  'bun-linux-x64',
].join(',')).split(',').map(target => target.trim()).filter(Boolean)

await mkdir(outDir, { recursive: true })
await buildPayload()

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

async function buildPayload() {
  const workDir = await mkdtemp(join('/private/tmp', 'beeper-cli-payload-'))
  try {
    await cp(join(root, 'package.json'), join(workDir, 'package.json'))
    await cp(join(root, 'bin'), join(workDir, 'bin'), { recursive: true })
    await mkdir(join(workDir, 'scripts'), { recursive: true })
    await cp(join(root, 'dist'), join(workDir, 'dist'), {
      recursive: true,
      filter: source => !source.includes('/dist/bin/') && source !== payloadArchive,
    })
    await cp(join(root, 'scripts', 'prepare-desktop-api.mjs'), join(workDir, 'scripts', 'prepare-desktop-api.mjs'))
    await run('bun', ['install', '--production'], { cwd: workDir })
    await run('bun', ['scripts/prepare-desktop-api.mjs'], { cwd: workDir })
    await rm(payloadArchive, { force: true })
    await run('tar', ['-czf', payloadArchive, '-C', workDir, '.'], { cwd: root })
  } finally {
    await rm(workDir, { recursive: true, force: true })
  }
}

async function run(command, args, options = {}) {
  const child = Bun.spawn([command, ...args], {
    cwd: options.cwd || root,
    env: { ...process.env, TMPDIR: '/private/tmp' },
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  })
  const code = await child.exited
  if (code !== 0) throw new Error(`${command} ${args.join(' ')} exited with ${code}`)
}
