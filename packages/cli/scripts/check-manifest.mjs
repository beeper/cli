#!/usr/bin/env node
/**
 * Validate the command manifest and the public plugin-sdk export.
 *
 *   - every manifest entry has at least one `examples[]` entry
 *   - the manifest contains no duplicates
 *   - the manifest matches src/commands/** filenames (defense-in-depth with cli-smoke.mjs)
 *   - the ./plugin-sdk subpath resolves at runtime and re-exports BeeperCommand
 */
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Config } from '@oclif/core/config'
import { commandManifest } from '../dist/lib/manifest.js'

const root = fileURLToPath(new URL('..', import.meta.url))
const failures = []
const config = await Config.load({ root })
const commandsByID = new Map(config.commands.map(command => [displayID(command.id), command]))

const seen = new Set()
for (const entry of commandManifest) {
  if (seen.has(entry.command)) failures.push(`Duplicate manifest entry: ${entry.command}`)
  seen.add(entry.command)
  if (!entry.examples?.length) failures.push(`Missing examples[] for: ${entry.command}`)
  if (!entry.description) failures.push(`Missing description for: ${entry.command}`)
  const command = commandsByID.get(entry.command)
  const summary = command?.summary || command?.description
  if (summary && entry.description !== summary) {
    failures.push(`Manifest description for "${entry.command}" must match oclif summary: "${summary}"`)
  }
}

// The manifest may list commands shipped by first-party plugins (e.g. `targets tunnel`
// from @beeper/cli-plugin-cloudflare). Only enforce that every file in src/commands has
// a manifest entry — the reverse direction is allowed to include plugin-provided commands.
const internalCommands = new Set(['autocomplete'])
const commandFiles = listCommandFiles(join(root, 'src/commands')).filter(file => !internalCommands.has(fileToCommand(file)))
const fileCommands = new Set(commandFiles.map(fileToCommand))
for (const file of fileCommands) {
  if (!seen.has(file)) failures.push(`Command file has no manifest entry: ${file}`)
}

try {
  const sdk = await import('../dist/plugin-sdk.js')
  if (typeof sdk.BeeperCommand !== 'function') failures.push('plugin-sdk: BeeperCommand is not exported as a class')
  for (const name of ['ensureWritable', 'writeEvent', 'printData', 'printList', 'printSuccess', 'createBeeperClient', 'resolveTarget', 'readConfig', 'CLIError', 'ExitCodes', 'notFound', 'ambiguous', 'authRequired', 'notReady']) {
    if (!(name in sdk)) failures.push(`plugin-sdk: missing export "${name}"`)
  }
} catch (error) {
  failures.push(`plugin-sdk: import failed — ${error.message}`)
}

if (failures.length > 0) {
  console.error(`check-manifest: ${failures.length} issue(s)`)
  for (const issue of failures) console.error(`  - ${issue}`)
  process.exit(1)
}

console.log(`check-manifest: ${commandManifest.length} commands ok, plugin-sdk surface ok`)

function listCommandFiles(dir) {
  const output = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    // Files / directories starting with _ are private/internal (e.g. _complete used by autocomplete).
    if (entry.name.startsWith('_') || entry.name === 'autocomplete.ts') continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) output.push(...listCommandFiles(path))
    else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) output.push(path)
  }
  return output
}

function fileToCommand(file) {
  const relative = file.slice(join(root, 'src/commands').length + 1)
  const parts = relative.replace(/\.(ts|tsx)$/, '').split('/')
  return parts.map(part => part === 'index' ? undefined : part).filter(Boolean).join(' ')
}

function displayID(id) {
  return id.replaceAll(':', ' ')
}
