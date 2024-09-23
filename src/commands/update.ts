import path from 'node:path'
import { Command } from 'commander'
import fs from 'fs-extra'
import prompts from 'prompts'
import { red, green, bold, yellow } from 'kolorist'
import {
  getLeaferVersion,
  getLeaferPackageInfo,
  getCommand,
  getPackageManager
} from '../../utils/index'

export const update = new Command()
  .name('update')
  .description('check and update leafer dependencies in your project')
  .option(
    '-c, --cwd <cwd>',
    'the working directory. defaults to the current directory.',
    process.cwd()
  )
  .action(async opts => {
    const cwd = path.resolve(opts.cwd)
    const packagePath = path.resolve(cwd, 'package.json')

    // check if package.json exist
    if (!fs.existsSync(packagePath)) {
      console.log(
        red(
          `No package.json file found in ${cwd}. Please initialize your project first.`
        )
      )
      process.exit(1)
    }

    // read package.json
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    }

    // get leafer dependencies
    const leaferDeps = await getLeaferPackageInfo()
    const updates = {}
    const hasLeaferDeps = Object.keys(leaferDeps).some(dep => dependencies[dep])

    // non-leafer
    if (!hasLeaferDeps) {
      console.log(red('No Leafer dependencies found in your project.'))
      return
    }

    // check updates
    const latestVersion = await getLeaferVersion()
    for (const dep of Object.keys(leaferDeps)) {
      if (
        dependencies[dep] &&
        latestVersion &&
        latestVersion !== dependencies[dep]
      ) {
        updates[dep] = latestVersion
      }
    }

    //  no need to update
    if (Object.keys(updates).length === 0) {
      console.log(green('All leafer dependencies are up to date.'))
      return
    }

    // ask
    const { confirm } = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: `The following Leafer dependencies can be updated:\n${JSON.stringify(
        updates,
        null,
        2
      )}\nDo you want to update them?`
    })

    if (confirm) {
      for (const [dep, version] of Object.entries(updates)) {
        if (packageJson.dependencies[dep]) {
          packageJson.dependencies[dep] = version
        } else if (packageJson.devDependencies[dep]) {
          packageJson.devDependencies[dep] = version
        }
      }

      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2))
      const agent = await getPackageManager(cwd)
      console.log()
      console.log(
        `Dependencies updated successfully! Please run ${green(
          bold(getCommand(agent, 'install'))
        )} to install the latest versions.`
      )
      console.log(
        yellow(
          'Tips : If an error occurs due to conflicts from cached old versions, you need to delete the lock file and reinstall.'
        )
      )
    } else {
      console.log(red('Update cancel`led.'))
    }
  })
