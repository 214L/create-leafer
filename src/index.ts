#!/usr/bin/env node

import path from 'path'
import fs from 'fs-extra'
import { type PackageJson } from 'type-fest'
import { Command } from 'commander'
import { create } from './commands/create'
import { plugin } from './commands/plugin'
import { init } from './commands/init'

process.on('SIGINT', () => process.exit(0))
process.on('SIGTERM', () => process.exit(0))

async function main() {
  const packageInfo = fs.readJSONSync(path.join('package.json')) as PackageJson
  const program = new Command()
    .name('leafer')
    .description('add leafer dependencies to your project')
    .version(
      packageInfo.version || '1.0.0',
      '-v, --version',
      'display the version number'
    )
    
  program.action(() => {
    create()
  })
  program.addCommand(init)
  program.addCommand(plugin)
  program.parse()
}

main()
