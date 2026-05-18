import { Args, Flags } from '@oclif/core'
import { mkdir, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { createClient } from '../../lib/client.js'
import { printSuccess } from '../../lib/output.js'
export default class MediaDownload extends BeeperCommand {
  static override summary = 'Download message media'
  static override args = { url: Args.string({ required: true, description: 'mxc:// or localmxc:// URL' }) }
  static override flags = {
    out: Flags.string({ char: 'o', default: '.', description: 'Output directory; pass - to stream the file to stdout' }),
  }
  async run(): Promise<void> {
    const { args, flags } = await this.parse(MediaDownload)
    const client = await createClient(flags)
    const response = await client.assets.serve({ url: args.url })
    const buffer = Buffer.from(await response.arrayBuffer())
    if (flags.out === '-') {
      process.stdout.write(buffer)
      return
    }
    ensureWritable(flags)
    await mkdir(flags.out, { recursive: true })
    const path = join(flags.out, basename(new URL(args.url).pathname) || 'media')
    await writeFile(path, buffer)
    await printSuccess({ message: 'Downloaded media', detail: path, data: { path, bytes: buffer.length } }, flags.json ? 'json' : 'human')
  }
}
