import assert from 'node:assert/strict'
import { Config } from '@oclif/core/config'
import { cloudflaredDomain, findKnownError, findTunnelURL, versionIsGreaterThan, whatToTry } from '../dist/lib/cloudflared.js'

const config = await Config.load({ root: new URL('..', import.meta.url).pathname })
const commandIDs = [...config.commands].map(command => command.id)

assert.deepEqual(commandIDs, ['targets:tunnel'])
assert.equal(versionIsGreaterThan('2024.8.2', '2024.8.1'), true)
assert.equal(versionIsGreaterThan('2024.8.2', '2024.8.2'), false)
assert.equal(versionIsGreaterThan('2024.8.2', '2024.9.0'), false)
assert.equal(findTunnelURL('INF https://example.trycloudflare.com ready'), 'https://example.trycloudflare.com')
assert.equal(findTunnelURL('INF https://example.example.com ready', 'example.com'), 'https://example.example.com')
assert.equal(findTunnelURL('INF https://example.example.com ready'), undefined)
assert.match(findKnownError('2024-01-01 ERR Failed to serve quic connection connIndex=1'), /Could not start Cloudflare Tunnel/)
assert.match(whatToTry(), /BEEPER_CLOUDFLARED_PATH/)

const previousDomain = process.env.BEEPER_CLOUDFLARED_DOMAIN
process.env.BEEPER_CLOUDFLARED_DOMAIN = 'beeper.test'
assert.equal(cloudflaredDomain(), 'beeper.test')
if (previousDomain === undefined) {
  delete process.env.BEEPER_CLOUDFLARED_DOMAIN
} else {
  process.env.BEEPER_CLOUDFLARED_DOMAIN = previousDomain
}
