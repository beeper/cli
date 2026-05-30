#!/usr/bin/env bun
import { chmod, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const cliRoot = fileURLToPath(new URL('../../cli/', import.meta.url))
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const cliPkg = JSON.parse(await readFile(join(cliRoot, 'package.json'), 'utf8'))
const binariesPath = join(cliRoot, 'dist', 'bin', 'binaries.json')
const binaries = existsSync(binariesPath)
  ? JSON.parse(await readFile(binariesPath, 'utf8'))
  : { command: 'beeper', package: cliPkg.name, version: cliPkg.version, artifacts: [] }

if (pkg.version !== cliPkg.version) {
  throw new Error(`packages/npm version ${pkg.version} does not match packages/cli version ${cliPkg.version}`)
}

await rm(join(root, 'bin'), { recursive: true, force: true })
await rm(join(root, 'binaries.json'), { force: true })
await rm(join(root, 'README.md'), { force: true })
await rm(join(root, 'LICENSE'), { force: true })
await mkdir(join(root, 'bin'), { recursive: true })
await cp(join(cliRoot, 'README.md'), join(root, 'README.md'))
await cp(join(cliRoot, 'LICENSE'), join(root, 'LICENSE'))
await writeFile(join(root, 'binaries.json'), `${JSON.stringify(binaries, null, 2)}\n`)
await writeFile(join(root, 'bin', 'beeper.js'), launcher())
await chmod(join(root, 'bin', 'beeper.js'), 0o755)

function launcher() {
  return `#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { createWriteStream, existsSync } from 'node:fs'
import { chmod, mkdir, readFile, rename, rm } from 'node:fs/promises'
import { get } from 'node:https'
import { homedir, platform as osPlatform, arch as osArch, tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(await readFile(join(packageRoot, 'binaries.json'), 'utf8'))
const platform = targetPlatform()
const artifact = manifest.artifacts.find(item => item.platform === platform)

if (!artifact) {
  console.error(`beeper-cli does not ship a binary for ${process.platform}/${process.arch}.`)
  process.exit(1)
}

const cacheDir = process.env.BEEPER_CLI_BINARY_CACHE_DIR || join(homedir(), '.cache', 'beeper-cli', manifest.version)
const binPath = join(cacheDir, 'bin', manifest.command || 'beeper')

const expectedBinarySha256 = artifact.binarySha256 || artifact.sha256

if (!existsSync(binPath) || await sha256(binPath).catch(() => '') !== expectedBinarySha256) {
  const tempDir = join(tmpdir(), `beeper-cli-${manifest.version}-${process.pid}`)
  const archivePath = join(tempDir, artifact.file)
  const downloadURL = `https://github.com/beeper/cli/releases/download/v${manifest.version}/${artifact.file}`
  logStep(`installing beeper-cli ${manifest.version} for ${platform}`)
  await rm(tempDir, { recursive: true, force: true })
  await mkdir(tempDir, { recursive: true })
  await download(downloadURL, archivePath)
  logStep('verifying download')
  const actual = await sha256(archivePath)
  if (actual !== artifact.sha256) {
    await rm(tempDir, { recursive: true, force: true })
    console.error(`beeper-cli binary checksum mismatch for ${artifact.file}.`)
    process.exit(1)
  }
  logStep('extracting binary')
  await extract(archivePath, tempDir)
  const extractedBin = join(tempDir, 'bin', manifest.command || 'beeper')
  await chmod(extractedBin, 0o755)
  logStep(`caching binary in ${cacheDir}`)
  await rm(cacheDir, { recursive: true, force: true })
  await mkdir(dirname(binPath), { recursive: true })
  await rename(extractedBin, binPath)
  await rm(tempDir, { recursive: true, force: true })
  logStep('ready')
}

if (process.env.BEEPER_CLI_LAUNCHER_DEBUG === '1') logStep(`starting ${binPath}`)
const child = spawn(binPath, process.argv.slice(2), { stdio: 'inherit', env: process.env })
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  process.exit(code ?? 1)
})

function logStep(message) {
  console.error(`beeper-cli: ${message}`)
}

function targetPlatform() {
  const os = osPlatform()
  const cpu = osArch()
  const normalizedOS = os === 'darwin' || os === 'linux' ? os : os === 'win32' ? 'windows' : os
  const normalizedArch = cpu === 'x64' || cpu === 'arm64' ? cpu : cpu
  return `${normalizedOS}-${normalizedArch}`
}

async function sha256(path) {
  const hash = createHash('sha256')
  hash.update(await readFile(path))
  return hash.digest('hex')
}

async function download(url, destination, redirects = 0) {
  if (redirects > 10) throw new Error(`Too many redirects while downloading ${artifact.file}`)

  logStep(`downloading ${artifact.file}`)
  await new Promise((resolve, reject) => {
    get(url, response => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode ?? 0) && response.headers.location) {
        response.resume()
        const nextURL = new URL(response.headers.location, url).toString()
        logStep(`redirecting to ${new URL(nextURL).host}`)
        download(nextURL, destination, redirects + 1).then(resolve, reject)
        return
      }
      if (response.statusCode !== 200) {
        response.resume()
        reject(new Error(`Download failed with HTTP ${response.statusCode}: ${url}`))
        return
      }
      const total = Number(response.headers['content-length'] ?? 0)
      let downloaded = 0
      let nextLoggedPercent = 25
      const file = createWriteStream(destination, { mode: 0o755 })
      response.on('data', chunk => {
        downloaded += chunk.length
        if (!total) return
        const percent = Math.floor(downloaded / total * 100)
        while (percent >= nextLoggedPercent && nextLoggedPercent <= 100) {
          logStep(`downloaded ${nextLoggedPercent}%`)
          nextLoggedPercent += 25
        }
      })
      response.pipe(file)
      file.on('finish', () => file.close(resolve))
      file.on('error', reject)
    }).on('error', reject)
  })
}

async function extract(archivePath, destination) {
  if (artifact.file.endsWith('.zip')) {
    await run('/usr/bin/ditto', ['-x', '-k', archivePath, destination])
    return
  }
  if (artifact.file.endsWith('.tar.gz')) {
    await run('tar', ['-xzf', archivePath, '-C', destination])
    return
  }
  throw new Error(`Unsupported beeper-cli archive: ${artifact.file}`)
}

async function run(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'ignore' })
    child.on('error', reject)
    child.on('exit', code => {
      if (code === 0) resolve()
      else reject(new Error(`${command} ${args.join(' ')} exited with ${code}`))
    })
  })
}
`
}
