#!/usr/bin/env node

import { execSync } from 'child_process'
import { Command } from 'commander'
import { vueTemplate } from './src/commands/vueTemplate'
import { plugin } from './src/commands/plugin'
import { init } from './src/commands/init'
process.on('SIGINT', () => process.exit(0))
process.on('SIGTERM', () => process.exit(0))

async function main() {
  let packageInfo = { name: 'create-leafer', version: process.env.VERSION }
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

  checkForUpdates()

  const program = new Command()
    .name('leafer')
    .description('create different Leafer projects')
    .version(
      packageInfo.version || '0.0.1',
      '-v, --version',
      'display the version number'
    )

  // program.addCommand(init)
  program.addCommand(vueTemplate)
  program.addCommand(plugin)
  program.parse()
}

main()
