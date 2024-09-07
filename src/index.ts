#!/usr/bin/env node

import { plugin } from './commands/plugin'
import { init } from './commands/init.ts'
import { Command } from 'commander'
import path from 'path'
import fs from 'fs-extra'
import { type PackageJson } from 'type-fest'

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
    console.log('没有提供参数，执行默认操作...')
  })
  program.addCommand(init)
  program.addCommand(plugin)
  program.parse()
}

main()
