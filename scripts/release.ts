#!/usr/bin/env bun
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const version = process.argv[2]

if (!version || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error('Usage: bun run release <version>')
  console.error('Example: bun run release 0.6.1')
  process.exit(2)
}

await setPackageVersion('packages/cli/package.json', version)
await setPackageVersion('packages/npm/package.json', version)

await run('bun', ['run', 'readme'], {
  cwd: join(root, 'packages/cli'),
  env: { ...process.env, PACKAGE_VERSION: version, TAG: `v${version}` },
})

await run('bun', ['run', 'release:local'], {
  cwd: join(root, 'packages/cli'),
  env: { ...process.env, PACKAGE_VERSION: version, TAG: `v${version}` },
})

async function setPackageVersion(path, nextVersion) {
  const absolute = join(root, path)
  const pkg = JSON.parse(await readFile(absolute, 'utf8'))
  pkg.version = nextVersion
  await writeFile(absolute, `${JSON.stringify(pkg, null, 2)}\n`)
  console.log(`${path} -> ${nextVersion}`)
}

async function run(command, args, options = {}) {
  const child = Bun.spawn([command, ...args], {
    cwd: options.cwd || root,
    env: options.env || process.env,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  })
  const code = await child.exited
  if (code !== 0) throw new Error(`${command} ${args.join(' ')} exited with ${code}`)
}
