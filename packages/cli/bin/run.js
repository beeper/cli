#!/usr/bin/env node
import { execute } from '@oclif/core'

const logo = String.raw`
    @@@@@@@@@@@@@@@      @@@@@@@   @@@@@@@@  @@@@@@@@  @@@@@@@   @@@@@@@@  @@@@@@@
  @@@@           @@@@    @@    @@  @@        @@        @@    @@  @@        @@    @@
 @@@               @@@   @@@@@@@   @@@@@@    @@@@@@    @@@@@@@   @@@@@@    @@@@@@@
 @@@               @@@   @@    @@  @@        @@        @@        @@        @@  @@
  @@@             @@@    @@    @@  @@        @@        @@        @@        @@   @@
    @@@@@@     @@@@      @@@@@@@   @@@@@@@@  @@@@@@@@  @@        @@@@@@@@  @@    @@
      @@@@@@ @@@@@@@
      @@@@@@@@@@@@@
`

if (process.argv.slice(2).length === 0 && process.env.BEEPER_NO_LOGO !== '1') {
  process.stdout.write(`${logo}\n`)
}

await execute({ dir: import.meta.url })
