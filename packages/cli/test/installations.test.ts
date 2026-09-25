import { expect, it } from 'bun:test'
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { createServer, type Socket } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { downloadArtifact } from '../src/lib/installations.js'

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
