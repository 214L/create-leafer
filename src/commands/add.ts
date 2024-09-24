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

const addOptionsSchema = z.object({
  cwd: z.string()
})

export const add = new Command()
  .name('add')
  .description('add or update leafer dependencies in your project')
  .option(
    '-c, --cwd <cwd>',
    'the working directory. defaults to the current directory.',
    process.cwd()
  )
  .action(async opts => {
    try {
      const options = addOptionsSchema.parse(opts)
      const cwd = path.resolve(options.cwd)
      const promptMessage = getPrompt()

      // Check if cwd exists
      if (!existsSync(cwd)) {
        console.log(red(`The path ${cwd} does not exist. Please try again.`))
        process.exit(1)
      }

      // Check if package.json exists
      if (!fs.existsSync(path.resolve(cwd, 'package.json'))) {
        console.log(
          lightGreen(
            `No package.json file found in ${cwd}. Please initialize your project first.`
          )
        )
        process.exit(1)
      }

      // Get package manager
      const agent = await getPackageManager(cwd)

      // Check for existing leafer packages
      const existingLeaferPackage = await findLeaferPackage(cwd)

      if (!existingLeaferPackage.length) {
        console.log(
          red(
            `No existing leafer package found. Please use ${lightGreen(
              bold('init')
            )} command to start your project.`
          )
        )
        process.exit(1)
      }


      // Parse package.json to get existing dependencies
      const packagePath = path.resolve(cwd, 'package.json')
      const existing = JSON.parse(fs.readFileSync(packagePath, 'utf8'))

      let existingDependencies = existing.dependencies || {}
      let existingDevDependencies = existing.devDependencies || {}

      // Prompt user for scene selection and leafer packages to add/update
      let result: {
        sceneSelect?: string
        leaferInSelect?: string[]
      } = {}

      // Pre-select scene based on existing leafer dependencies
      const preSelectScene = Object.keys(existingDependencies).find(dep =>
        ['leafer-editor', 'leafer-draw', 'leafer-ui'].includes(dep)
      )
      const selectedScene =
        preSelectScene === 'leafer-editor'
          ? 'editor'
          : preSelectScene === 'leafer-draw'
          ? 'draw'
          : 'skip'

      // Pre-select plugins based on existing leaferIn packages
      const selectedPlugins = Object.keys(existingDependencies)
        .filter(dep => dep.startsWith('@leafer-in/'))
        .map(dep => dep.replace('@leafer-in/', ''))

      try {
        result = await prompts(
          [
            {
              name: 'sceneSelect',
              type: 'select',
              message: promptMessage.sceneSelect.message,
              choices: promptMessage.sceneSelect.choices,
              initial:
                promptMessage.sceneSelect.choices
                  .map(item => item.value)
                  .indexOf(selectedScene) || 0
            },
            {
              name: 'leaferInSelect',
              type: 'multiselect',
              message: promptMessage.leaferInSelect.message,
              choices: prev =>
                handlePluginChoices(
                  prev,
                  promptMessage.leaferInSelect.choices,
                  selectedPlugins
                ),
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

      // Handle dependencies to add or update
      let dependencies = []
      let devDependencies = []
      let excludePlugin = []
      if (result.sceneSelect === 'editor') {
        dependencies.push(`leafer-editor`)
        excludePlugin = ['editor', 'view', 'scroll', 'arrow', 'html']
      } else if (result.sceneSelect === 'draw') {
        dependencies.push(`leafer-draw`)
      } else {
        dependencies.push(`leafer-ui`)
      }

      // Exclude plugins if necessary
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

      // Handle platform restrictions
      const leaferVersion = await getLeaferVersion()

      // Update package.json dependencies
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

      // Prompt to start project
      console.log(`\n${promptMessage.infos.done}\n`)
      const root = process.cwd()

      if (root !== cwd) {
        const cdProjectName = path.relative(root, cwd)

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
      console.error(red('An error occurred during the add process:'), error)
      process.exit(1)
    }
  })

function handlePluginChoices(prev, choices, selectedPlugins) {
  const initChosen = ['editor', 'view', 'scroll', 'arrow', 'html']

  choices.forEach(item => {
    if (prev === 'editor' && initChosen.includes(item.value)) {
      item.selected = true
    }
    if (selectedPlugins.includes(item.value)) {
      item.selected = true
    }
  })

  return choices
}
