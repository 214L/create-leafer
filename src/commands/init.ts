import path from 'node:path'
import { Command } from 'commander'
import { z } from 'zod'
import fs, { existsSync } from 'fs-extra'
import prompts from 'prompts'
import { red, lightGreen, bold, green } from 'kolorist'
import {
  getPrompt,
  getPackageManager,
  getLeaferPackageInfo,
  findLeaferPackage,
  getLeaferVersion,
  getCommand
} from '../../utils/index'
const initOptionsSchema = z.object({
  cwd: z.string(),
})
export const init = new Command()
  .name('init')
  .description('initialize your leafer project and install dependencies')
  .option(
    '-c, --cwd <cwd>',
    'the working directory. defaults to the current directory.',
    process.cwd()
  )
  .action(async opts => {
    try {
      const options = initOptionsSchema.parse(opts)
      const cwd = path.resolve(options.cwd)
      const promptMessage = getPrompt()

      //check cwd exist
      if (!existsSync(cwd)) {
        console.log(red(`The path ${cwd} does not exist. Please try again.`))
        process.exit(1)
      }
      //check package.json exist
      if (!fs.existsSync(path.resolve(cwd, 'package.json'))) {
        console.log(
          lightGreen(
            `No package.json file found in ${cwd}. Please initialize your project first.`
          )
        )
      }
      //get package manager
      const agent = await getPackageManager(cwd)

      //check existing leafer package
      const existingLeaferPackage = await findLeaferPackage(cwd)

      //if leafer exist tell user use add instead of init
      if (existingLeaferPackage.length) {
        console.log(
          red(
            `The project already has leafer installed. Please use ${lightGreen(
              bold('add')
            )} command instead of ${lightGreen(bold('init'))} command.`
          )
        )
        process.exit(1)
      }
      
      //prompt choose run platform
      let result: {
        supportPlatforms?: string
        sceneSelect?: string
        leaferInSelect?: string[]
      } = {}
      try {
        result = await prompts(
          [
            {
              name: 'supportPlatforms',
              type: 'select',
              message: promptMessage.supportPlatform.message,
              choices: [
                { title: 'web', value: 'web' },
                { title: 'worker', value: 'worker' },
                { title: 'node', value: 'node' },
                { title: 'miniapp', value: 'miniapp' }
              ]
            },
            {
              name: 'sceneSelect',
              type: 'select',
              message: promptMessage.sceneSelect.message,
              choices: promptMessage.sceneSelect.choices
            },
            {
              name: 'leaferInSelect',
              type: 'multiselect',
              message: promptMessage.leaferInSelect.message,
              choices: prev =>
                handlePluginChoices(prev, promptMessage.leaferInSelect.choices),
              hint: promptMessage.leaferInSelect.hint,
              instructions: false,
              min: 0,
              max: 10
            }
          ],
          {
            onCancel: () => {
              throw new Error(
                red('✖') + ` ${promptMessage.errors.operationCancelled}`
              )
            }
          }
        )
      } catch (cancelled) {
        console.log('cancelled', cancelled)
        process.exit(1)
      }
      //handle dependencies
      let dependencies = []
      let devDependencies = []
      let excludePlugin = []
      if (result.sceneSelect === 'editor') {
        dependencies.push(
          result.supportPlatforms === 'web'
            ? `leafer-editor`
            : `@leafer-editor/${result.supportPlatforms}`
        )
        excludePlugin = ['editor', 'view', 'scroll', 'arrow', 'html']
      } else if (result.sceneSelect === 'draw') {
        dependencies.push(
          result.supportPlatforms === 'web'
            ? `leafer-draw`
            : `@leafer-draw/${result.supportPlatforms}`
        )
      } else {
        dependencies.push(
          result.supportPlatforms === 'web'
            ? `leafer-ui`
            : `@leafer-ui/${result.supportPlatforms}`
        )
      }

      //exclude plugin
      if (result.leaferInSelect.length) {
        result.leaferInSelect
          .filter(item => !excludePlugin.includes(item))
          .map(item => {
            if (item === 'interface') {
              devDependencies.push(`@leafer-in/${item}`)
            } else {
              dependencies.push(`@leafer-in/${item}`)
            }
          })
      }

      // Handle platform
      if (result.supportPlatforms !== 'web') {
        const htmlIndex = dependencies.indexOf('@leafer-in/html')
        if (htmlIndex !== -1) {
          // Remove 'html' from dependencies
          dependencies.splice(htmlIndex, 1)
          console.log(
            red(
              '/* @leafer-in/html plugin not supported on non-web platforms, removed from dependencies */'
            )
          )
        }
      }
      let leaferVersion = await getLeaferVersion()
      //write file
      let packagePath = path.resolve(cwd, 'package.json')
      const existing = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
      if (dependencies.length) {
        existing.dependencies = dependencies.reduce((acc, cur) => {
          acc[cur] = `^${leaferVersion}`
          return acc
        }, existing.dependencies || {})
      }
      if (devDependencies.length) {
        existing.devDependencies = devDependencies.reduce((acc, cur) => {
          acc[cur] = `^${leaferVersion}`
          return acc
        }, existing.devDependencies || {})
      }
      fs.writeFileSync(packagePath, JSON.stringify(existing, null, 2))

      //prompt start project
      console.log(`\n${promptMessage.infos.done}\n`)
      const root = process.cwd()

      if (root !== cwd) {
        const cdProjectName = path.relative(root, cwd)
        console.log(cdProjectName)

        console.log(
          `  ${bold(
            `cd ${
              cdProjectName.includes(' ') ? `"${cdProjectName}"` : cdProjectName
            }`
          )}`
        )
      }
      console.log(`  ${bold(green(getCommand(agent, 'install')))}`)
      console.log(`  ${bold(green(getCommand(agent, 'dev')))}`)
      console.log()
    } catch (error) {
      console.error(
        red('An error occurred during the initialization process:'),
        error
      )
      process.exit(1)
    }
  })
function handlePluginChoices(prev, choices) {
  if (prev === 'editor') {
    let initChosen = ['editor', 'view', 'scroll', 'arrow', 'html']
    choices.forEach(item => {
      if (initChosen.includes(item.value)) {
        item.selected = true
      }
    })
  }
  return choices
}
