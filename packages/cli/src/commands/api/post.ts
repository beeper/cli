import { Args, Flags } from '@oclif/core'
import { BeeperCommand, ensureWritable } from '../../lib/command.js'
import { appRequest } from '../../lib/app-api.js'
import { createClient } from '../../lib/client.js'
import { printData, printDryRun } from '../../lib/output.js'

export default class ApiPost extends BeeperCommand {
  static override summary = 'Call a raw Desktop API POST path with a JSON body'
  static override args = {
    path: Args.string({ description: 'API path, for example /v1/messages/{chatID}/send', required: true }),
  }
  static override flags = {
    body: Flags.string({ default: '{}', description: 'JSON request body' }),
    json: Flags.boolean({ default: true, allowNo: true, description: 'Print JSON' }),
    'no-auth': Flags.boolean({ default: false, description: 'Call a public API path without a bearer token' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ApiPost)
    ensureWritable(flags)
    const format = flags.json ? 'json' : 'human'
    let body: Record<string, unknown>
    try {
      body = JSON.parse(flags.body) as Record<string, unknown>
    } catch {
      throw new Error(`--body is not valid JSON: ${flags.body}`)
    }
    if (flags['dry-run']) {
      await printDryRun('api.post', { method: 'POST', path: args.path, body, noAuth: flags['no-auth'], target: flags.target, baseURL: flags['base-url'] }, format)
      return
    }
    if (flags['no-auth']) {
      await printData(await appRequest('POST', args.path, { baseURL: flags['base-url'], body, target: flags.target, token: false }), format)
      return
    }
    const client = await createClient(flags)
    await printData(await client.post(args.path, { body }), format)
  }
}
