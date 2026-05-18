#!/usr/bin/env bun
import { readdir, writeFile } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const commandsDir = join(root, 'src', 'commands')
const outPath = join(root, 'src', 'commands.generated.ts')

const files = await listCommandFiles(commandsDir)
const entries = files
  .map(file => ({
    command: fileToCommand(file),
    importPath: `./commands/${relative(commandsDir, file).split(sep).join('/').replace(/\.(ts|tsx)$/, '.js')}`,
  }))
  .sort((a, b) => a.command.localeCompare(b.command))

const imports = entries.map((entry, index) => `import Command${index} from '${entry.importPath}'`).join('\n')
const mapEntries = entries.map((entry, index) => `  '${entry.command}': Command${index},`).join('\n')

await writeFile(
  outPath,
  `${imports}

export const commands = {
${mapEntries}
}
`,
)

async function listCommandFiles(dir) {
  const output = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('_')) continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      output.push(...await listCommandFiles(path))
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      output.push(path)
    }
  }
  return output
}

function fileToCommand(file) {
  const commandPath = relative(commandsDir, file).split(sep).join('/')
  const parts = commandPath.replace(/\.(ts|tsx)$/, '').split('/')
  return parts.map(part => part === 'index' ? undefined : part).filter(Boolean).join(':')
}
