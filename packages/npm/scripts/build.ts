#!/usr/bin/env bun
import { chmod, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { minify } from 'terser'

const root = fileURLToPath(new URL('..', import.meta.url))
const cliRoot = fileURLToPath(new URL('../../cli/', import.meta.url))
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const cliPkg = JSON.parse(await readFile(join(cliRoot, 'package.json'), 'utf8'))

if (pkg.version !== cliPkg.version) {
  throw new Error(`packages/npm version ${pkg.version} does not match packages/cli version ${cliPkg.version}`)
}

await rm(join(root, 'bin'), { recursive: true, force: true })
await rm(join(root, 'dist'), { recursive: true, force: true })
await rm(join(root, 'README.md'), { force: true })
await rm(join(root, 'LICENSE'), { force: true })
await mkdir(join(root, 'bin'), { recursive: true })
await mkdir(join(root, 'dist'), { recursive: true })
await cp(join(cliRoot, 'README.md'), join(root, 'README.md'))
await cp(join(cliRoot, 'LICENSE'), join(root, 'LICENSE'))
await cp(join(cliRoot, 'dist'), join(root, 'dist'), { recursive: true })
await cp(join(cliRoot, 'bin', 'logo.js'), join(root, 'bin', 'logo.js'))
await writeFile(join(root, 'bin', 'beeper.js'), launcher())
await chmod(join(root, 'bin', 'beeper.js'), 0o755)
await minifyJavaScriptTree(join(root, 'dist'))
await minifyJavaScriptTree(join(root, 'bin'))

function launcher() {
  return `#!/usr/bin/env node
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execute } from '@oclif/core'
import { renderStartupLogo } from './logo.js'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
if (process.argv.slice(2).length === 0 && process.env.BEEPER_NO_LOGO !== '1') {
  process.stdout.write(\`\${renderStartupLogo()}\\n\\n\`)
}

await execute({ dir: packageRoot })
`
}

async function minifyJavaScriptTree(dir: string): Promise<void> {
  for await (const path of walkJavaScriptFiles(dir)) {
    const source = await readFile(path, 'utf8')
    const shebang = source.startsWith('#!') ? `${source.slice(0, source.indexOf('\n'))}\n` : ''
    const minifySource = shebang ? source.slice(source.indexOf('\n') + 1) : source
    const output = await minify(minifySource, {
      compress: true,
      ecma: 2022,
      format: { comments: /^!/ },
      module: true,
      mangle: true,
    })
    if (!output.code) throw new Error(`Failed to minify ${path}`)
    await writeFile(path, `${shebang}${output.code}\n`)
  }
}

async function* walkJavaScriptFiles(dir: string): AsyncGenerator<string> {
  const entries = await Array.fromAsync(new Bun.Glob('**/*.js').scan({ cwd: dir, absolute: true }))
  for (const entry of entries) yield entry
}
