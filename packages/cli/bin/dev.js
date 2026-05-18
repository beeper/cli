#!/usr/bin/env bun
import { execute } from '@oclif/core'
import { renderStartupLogo } from './logo.js'

void (async () => {
  if (process.argv.slice(2).length === 0 && process.env.BEEPER_NO_LOGO !== '1') {
    process.stdout.write(`${renderStartupLogo()}\n\n`)
  }

  await execute({ development: true, dir: import.meta.url })
})()
