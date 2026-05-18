#!/usr/bin/env bun
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const outDir = join(root, 'dist', 'bin')
const manifestPath = join(outDir, 'binaries.json')
const teamID = process.env.TEAM_ID || process.env.APPLE_TEAM_ID || 'PZYM8XX95Q'
const secretsFile = process.env.MOBILE_SECRETS_FILE
const requireSigning = process.env.BEEPER_CLI_REQUIRE_MACOS_SIGNING === '1'

if (process.platform !== 'darwin') {
  if (requireSigning) throw new Error('macOS binary signing requires a macOS runner.')
  console.log('Skipping macOS binary signing on non-macOS runner.')
  process.exit(0)
}

const workDir = await mkdtemp(join(tmpdir(), 'beeper-cli-signing-'))

try {
  const credentials = await prepareCredentials(workDir)
  const identity = process.env.MACOS_CODESIGN_IDENTITY || process.env.IDENTITY || await findIdentity(teamID)

  if (!identity) {
    if (credentials.match) {
      await importDeveloperID(workDir)
    } else {
      if (requireSigning) throw new Error(`No Developer ID Application identity for team ${teamID}`)
      console.log('Skipping macOS binary signing because no Developer ID identity is available.')
      process.exit(0)
    }
  }

  const resolvedIdentity = identity || await findIdentity(teamID)
  if (!resolvedIdentity) {
    throw new Error(
      `Fastlane match completed, but macOS still has no usable Developer ID Application identity for team ${teamID}. ` +
        'Run `security find-identity -v -p codesigning`; it must list a Developer ID Application certificate with an attached private key. ' +
        'If it does not, fix the local keychain or match signing storage before rerunning release.',
    )
  }

  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  const darwinArtifacts = manifest.artifacts.filter(artifact => artifact.platform.startsWith('darwin-'))

  for (const artifact of darwinArtifacts) {
    await run('/usr/bin/codesign', [
      '--force',
      '--options',
      'runtime',
      '--timestamp',
      '--sign',
      resolvedIdentity,
      ...(process.env.MACOS_CODESIGN_KEYCHAIN ? ['--keychain', process.env.MACOS_CODESIGN_KEYCHAIN] : []),
      artifact.path,
    ])

    await run('/usr/bin/codesign', ['--verify', '--strict', '--verbose=2', artifact.path])

    if (credentials.notary) {
      await notarize(artifact.path, credentials)
    } else {
      if (requireSigning) throw new Error('App Store Connect credentials are required for notarization.')
      console.log('Skipping notarization because App Store Connect credentials are not available.')
    }

    artifact.sha256 = await hashFile(artifact.path)
    console.log(`${artifact.path}`)
    console.log(`sha256 ${artifact.sha256}`)
  }

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
} finally {
  await rm(workDir, { recursive: true, force: true })
}

async function notarize(path, credentials) {
  const zipPath = join(outDir, `${basename(path)}.zip`)
  await run('/usr/bin/ditto', ['-c', '-k', '--keepParent', path, zipPath])
  if (credentials.p8) {
    await run('/usr/bin/xcrun', [
      'notarytool',
      'submit',
      zipPath,
      '--key',
      credentials.p8,
      '--key-id',
      credentials.keyID,
      '--issuer',
      credentials.issuerID,
      '--wait',
    ])
  } else {
    await run('/usr/bin/xcrun', [
      'notarytool',
      'submit',
      zipPath,
      '--apple-id',
      credentials.appleID,
      '--password',
      credentials.applePassword,
      '--team-id',
      credentials.teamID,
      '--wait',
    ])
  }
  await run('/usr/bin/codesign', ['--verify', '--strict', '--verbose=2', path])
}

async function prepareCredentials(workDir) {
  const envCredentials = {
    appleID: process.env.APPLE_ID,
    applePassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamID,
  }

  if (envCredentials.appleID && envCredentials.applePassword) {
    return { ...envCredentials, notary: true, match: false }
  }

  if (!secretsFile || !existsSync(secretsFile)) return { notary: false, match: false }

  const envFile = join(workDir, 'secrets.env')
  const p8 = join(workDir, `AuthKey_${teamID}.p8`)
  await run('ruby', [new URL('./read-signing-secrets.rb', import.meta.url).pathname], {
    env: {
      ...process.env,
      SECRETS_FILE: secretsFile,
      TEAM_ID: teamID,
      ENV_FILE: envFile,
      P8_FILE: p8,
    },
  })
  const parsed = parseEnv(await readFile(envFile, 'utf8'))
  Object.assign(process.env, parsed)
  return {
    keyID: parsed.APP_STORE_CONNECT_API_KEY_KEY_ID,
    issuerID: parsed.APP_STORE_CONNECT_API_KEY_ISSUER_ID,
    p8,
    notary: true,
    match: Boolean(parsed.MATCH_PASSWORD && parsed.MATCH_S3_ACCESS_KEY && parsed.MATCH_S3_SECRET_ACCESS_KEY),
  }
}

async function importDeveloperID(workDir) {
  const fastlaneDir = join(workDir, 'fastlane')
  await mkdir(fastlaneDir, { recursive: true })
  await writeFile(
    join(fastlaneDir, 'Fastfile'),
    `default_platform(:mac)

lane :import_developer_id do
  setup_ci
  sync_code_signing(
    type: "developer_id",
    platform: "macos",
    team_id: ENV.fetch("BEEPER_CLI_TEAM_ID"),
    app_identifier: [],
    storage_mode: "s3",
    s3_bucket: "a8c-fastlane-match",
    s3_region: "us-east-2",
    s3_access_key: ENV.fetch("MATCH_S3_ACCESS_KEY"),
    s3_secret_access_key: ENV.fetch("MATCH_S3_SECRET_ACCESS_KEY"),
    readonly: true
  )
end
`,
  )
  const fastlane = await commandExists('fastlane')
  if (fastlane) {
    await run('fastlane', ['import_developer_id'], {
      cwd: workDir,
      env: {
        ...process.env,
        FASTLANE_DISABLE_COLORS: '1',
        FASTLANE_HIDE_CHANGELOG: '1',
        FASTLANE_SKIP_UPDATE_CHECK: '1',
        BEEPER_CLI_TEAM_ID: teamID,
      },
      scrub: [
        process.env.MATCH_S3_ACCESS_KEY,
        process.env.MATCH_S3_SECRET_ACCESS_KEY,
        process.env.MATCH_PASSWORD,
      ],
    })
    return
  }
  throw new Error('No Developer ID identity found and fastlane is unavailable.')
}

async function findIdentity(team) {
  const args = ['/usr/bin/security', 'find-identity', '-v', '-p', 'codesigning']
  const child = Bun.spawn(args, {
    stdout: 'pipe',
    stderr: 'pipe',
  })
  const [stdout, code] = await Promise.all([new Response(child.stdout).text(), child.exited])
  if (code !== 0) return undefined
  for (const line of stdout.split('\n')) {
    if (!line.includes('Developer ID Application:') || !line.includes(`(${team})`)) continue
    const match = line.match(/"([^"]+)"/)
    if (match) return match[1]
  }
  return undefined
}

async function commandExists(command) {
  const child = Bun.spawn(['/usr/bin/which', command], { stdout: 'ignore', stderr: 'ignore' })
  return (await child.exited) === 0
}

function parseEnv(source) {
  return Object.fromEntries(
    source
      .split('\n')
      .map(line => line.match(/^export ([A-Z0-9_]+)=(.*)$/))
      .filter(Boolean)
      .map(match => [match[1], shellUnescape(match[2])]),
  )
}

function shellUnescape(value) {
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1).replaceAll("'\\''", "'")
  return value.replaceAll(/\\(.)/g, '$1')
}

async function hashFile(path) {
  const hasher = new Bun.CryptoHasher('sha256')
  hasher.update(await Bun.file(path).arrayBuffer())
  return hasher.digest('hex')
}

async function run(command, args, options = {}) {
  const code = await runAllowFailure(command, args, options)
  if (code !== 0) throw new Error(`${command} ${scrub(args.join(' '), options.scrub ?? [])} exited with ${code}`)
}

async function runAllowFailure(command, args, options = {}) {
  if (command.startsWith('/') && !existsSync(command)) throw new Error(`Missing command: ${command}`)
  const child = Bun.spawn([command, ...args], {
    cwd: options.cwd || root,
    env: options.env || process.env,
    stdin: 'ignore',
    stdout: options.quiet || options.scrub ? 'pipe' : 'inherit',
    stderr: options.quiet || options.scrub ? 'pipe' : 'inherit',
  })
  const [, , code] = await Promise.all([
    options.quiet ? drain(child.stdout) : options.scrub ? collect(child.stdout, process.stdout, options.scrub) : Promise.resolve(),
    options.quiet ? drain(child.stderr) : options.scrub ? collect(child.stderr, process.stderr, options.scrub) : Promise.resolve(),
    child.exited,
  ])
  return code
}

async function drain(stream) {
  for await (const _chunk of stream) {
  }
}

async function collect(stream, sink, scrubValues) {
  const decoder = new TextDecoder()
  for await (const chunk of stream) {
    const text = typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true })
    sink.write(scrub(text, scrubValues))
  }
  const rest = decoder.decode()
  if (rest) sink.write(scrub(rest, scrubValues))
}

function scrub(text, values) {
  return values.filter(Boolean).reduce((next, value) => next.replaceAll(value, '[redacted]'), text)
}
