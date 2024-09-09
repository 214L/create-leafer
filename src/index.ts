#!/usr/bin/env node

import path from 'path'
import fs from 'fs-extra'
import { type PackageJson } from 'type-fest'
import { execSync } from 'child_process'
import { Command } from 'commander'
import { vueTemplate } from './commands/vueTemplate'
import { plugin } from './commands/plugin'
import { init } from './commands/init'

process.on('SIGINT', () => process.exit(0))
process.on('SIGTERM', () => process.exit(0))

async function main() {
  const packageInfo = fs.readJSONSync(path.join('package.json')) as PackageJson

  function checkForUpdates() {
    try {
      const latestVersion = execSync(`npm show ${packageInfo.name} version`)
        .toString()
        .trim()
      if (!packageInfo.version) {
        throw new Error('Version not found in package.json')
      }
      const [latestMajor, latestMinor] = latestVersion.split('.').map(Number)
      const [currentMajor, currentMinor] = packageInfo.version
        .split('.')
        .map(Number)

      if (
        latestMajor > currentMajor ||
        (latestMajor === currentMajor && latestMinor > currentMinor)
      ) {
        console.log(
          `create-leafer update available: ${packageInfo.version} → ${latestVersion}`
        )
        console.log(`Run npm install -g ${packageInfo.name} to update.`)
      }
    } catch (err) {
      console.error('Error checking for updates:', err)
    }
  }

  // checkForUpdates()

  const program = new Command()
    .name('leafer')
    .description('add leafer dependencies to your project')
    .version(
      packageInfo.version || '1.0.0',
      '-v, --version',
      'display the version number'
    )

 
  program.addCommand(init)
  program.addCommand(vueTemplate)
  program.addCommand(plugin)
  program.parse()
}

main()
