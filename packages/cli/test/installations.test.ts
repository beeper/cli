import { afterEach, describe, expect, it } from 'bun:test'
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { createServer, type Socket } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { downloadArtifact, feedURLFor, installServer, normalizeInstallRequest } from '../src/lib/installations.js'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

it('installs a complete download without staging it in the system temp directory', async () => {
  const destination = await mkdtemp(join(tmpdir(), 'beeper-download-'))
  const originalTmpdir = process.env.TMPDIR
  // An unusable temp directory fails the same way a temp directory on another filesystem does.
  process.env.TMPDIR = join(destination, 'unavailable')
  const server = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    fetch: () => new Response('server artifact'),
  })
  try {
    const artifact = await downloadArtifact(new URL('/beeper-server.tar.gz', server.url).href, destination)

    expect(artifact).toBe(join(destination, 'beeper-server.tar.gz'))
    expect(await readFile(artifact, 'utf8')).toBe('server artifact')
    expect(await readdir(destination)).toEqual(['beeper-server.tar.gz'])
  } finally {
    if (originalTmpdir === undefined) delete process.env.TMPDIR
    else process.env.TMPDIR = originalTmpdir
    server.stop(true)
    await rm(destination, { recursive: true, force: true })
  }
})

it('removes the partial file when a download is interrupted', async () => {
  const destination = await mkdtemp(join(tmpdir(), 'beeper-download-'))
  let connection: Socket | undefined
  const server = createServer(socket => {
    connection = socket
    socket.write('HTTP/1.1 200 OK\r\nContent-Length: 1000\r\n\r\npartial')
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as { port: number }
  try {
    const download = downloadArtifact(`http://127.0.0.1:${port}/beeper-server.tar.gz`, destination)
    while ((await readdir(destination)).length === 0) await Bun.sleep(5)
    connection?.destroy()

    await expect(download).rejects.toThrow()
    expect(await readdir(destination)).toEqual([])
  } finally {
    server.close()
    await rm(destination, { recursive: true, force: true })
  }
})

describe('server installation artifact selection', () => {
  it('uses the production stable Server artifact by default', () => {
    const request = normalizeInstallRequest({ kind: 'server', platform: 'linux', arch: 'x64' })

    expect(request.channel).toBe('stable')
    expect(request.serverEnv).toBe('production')
    expect(request.bundleID).toBe('com.automattic.beeper.server')
    expect(request.apiBaseURL).toBe('https://api.beeper.com')
    expect(feedURLFor(request)).toBe('https://api.beeper.com/desktop/update-feed.json?bundleID=com.automattic.beeper.server&platform=linux&channel=stable&arch=x64')
  })

  it('keeps staging stable when staging is explicitly selected', () => {
    const request = normalizeInstallRequest({ kind: 'server', serverEnv: 'staging', channel: 'stable', platform: 'linux', arch: 'x64' })

    expect(request.channel).toBe('stable')
    expect(request.serverEnv).toBe('staging')
    expect(request.bundleID).toBe('com.automattic.beeper.server')
    expect(request.apiBaseURL).toBe('https://api.beeper-staging.com')
  })

  it('keeps nightly explicit instead of deriving it from the environment', () => {
    const request = normalizeInstallRequest({ kind: 'server', channel: 'nightly', platform: 'linux', arch: 'x64' })

    expect(request.channel).toBe('nightly')
    expect(request.serverEnv).toBe('production')
    expect(request.bundleID).toBe('com.automattic.beeper.server.nightly')
    expect(request.apiBaseURL).toBe('https://api.beeper.com')
  })

  it('fails closed when the selected Server feed has no artifact URL', async () => {
    let calls = 0
    globalThis.fetch = async () => {
      calls += 1
      return calls === 1
        ? new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } })
        : new Response('unexpected download', { status: 404, statusText: 'Not Found' })
    }

    await expect(installServer()).rejects.toThrow('Beeper Server stable update feed did not include an artifact URL; refusing to install a different channel.')
    expect(calls).toBe(1)
  })

  it('fails closed when the stable feed returns a nightly artifact', async () => {
    let calls = 0
    globalThis.fetch = async () => {
      calls += 1
      return calls === 1
        ? Response.json({ url: 'https://downloads.beeper.com/beeper-server-nightly-4.3.23-linux-x64.tar.gz' })
        : new Response('unexpected download', { status: 404, statusText: 'Not Found' })
    }

    await expect(installServer()).rejects.toThrow('Beeper Server stable update feed returned a nightly artifact; refusing to install a different channel.')
    expect(calls).toBe(1)
  })
})
