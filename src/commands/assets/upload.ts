import { Args, Command, Flags } from '@oclif/core'
import { createReadStream } from 'node:fs'
import { createClient } from '../../lib/client.js'
import { printData } from '../../lib/output.js'

export default class AssetsUpload extends Command {
  static override summary = 'Upload a file and return an upload ID'
  static override args = {
    file: Args.string({ description: 'File to upload', required: true }),
  }
  static override flags = {
    'base-url': Flags.string({ description: 'Beeper Desktop API base URL' }),
    debug: Flags.boolean({ default: false }),
    'file-name': Flags.string({ description: 'Display filename' }),
    json: Flags.boolean({ default: false, description: 'Print JSON' }),
    'mime-type': Flags.string({ description: 'MIME type' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AssetsUpload)
    const client = await createClient(flags)
    const result = await client.assets.upload({
      file: createReadStream(args.file),
      fileName: flags['file-name'],
      mimeType: flags['mime-type'],
    })
    printData(result, flags.json ? 'json' : 'human')
  }
}
