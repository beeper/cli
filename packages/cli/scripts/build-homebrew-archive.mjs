#!/usr/bin/env bun
import { createHash } from 'node:crypto'
import { chmod, cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const version = process.env.PACKAGE_VERSION || pkg.version
const binaryDir = join(root, 'dist', 'bin')
const outDir = join(root, 'dist', 'release')
const metadataPath = join(outDir, 'homebrew.json')
const platforms = ['darwin-arm64', 'darwin-x64']

await mkdir(outDir, { recursive: true })

const archives = []
for (const platform of platforms) {
  const binaryPath = join(binaryDir, `beeper-${platform}`)
  const workDir = await mkdtemp(join(tmpdir(), `beeper-cli-${platform}-`))
  const archiveName = `beeper-cli_${version}_${platform}.tar.gz`
  const archivePath = join(outDir, archiveName)

  await mkdir(join(workDir, 'bin'), { recursive: true })
  const installedBinary = join(workDir, 'bin', 'beeper')
  await cp(binaryPath, installedBinary)
  await chmod(installedBinary, 0o755)
  await rm(archivePath, { force: true })
  await run('tar', ['-czf', archivePath, '-C', workDir, '.'], { cwd: root })
  const sha256 = await hashFile(archivePath)
  archives.push({ archive: basename(archivePath), path: archivePath, platform, sha256 })
  console.log(`${archivePath}`)
  console.log(`sha256 ${sha256}`)
  await rm(workDir, { recursive: true, force: true })
}

await writeFile(
  metadataPath,
  `${JSON.stringify(
    {
      archives,
      command: 'beeper',
      displayName: 'Beeper CLI',
      package: 'beeper-cli',
      version,
    },
    null,
    2,
  )}\n`,
)

async function hashFile(path) {
  const hash = createHash('sha256')
  hash.update(await readFile(path))
  return hash.digest('hex')
}

async function run(command, args, options = {}) {
  await new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd || root,
      env: process.env,
      stdio: 'inherit',
    })

    child.on('error', reject)
    child.on('exit', code => {
      if (code === 0) {
        resolvePromise()
        return
      }

      reject(new Error(`${command} ${args.join(' ')} exited with ${code}`))
    })
  })
}
