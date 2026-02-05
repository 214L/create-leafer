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

const LeaferInPlugins = [
  'viewport',
  'view',
  'scroll',
  'arrow',
  'html',
  'text-editor',
  'motion-path',
  'robot',
  'state',
  'find',
  'export',
  'filter',
  'color',
  'resize',
  'bright'
]
const editorIncludes = [
  'text-editor',
  'viewport',
  'view',
  'scroll',
  'arrow',
  'html',
  'find',
  'export'
]
const gameIncludes = ['robot', 'state', 'motion-path', 'find']

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

      const allDeps = [
        ...Object.keys(existingDependencies),
        ...Object.keys(existingDevDependencies)
      ]
      const selectedScene = getSceneFromDeps(allDeps)
      const platform = getPlatformFromDeps(allDeps)

      // Pre-select plugins based on existing leaferIn packages
      const selectedPlugins = new Set(
        allDeps
          .filter(dep => dep.startsWith('@leafer-in/'))
          .map(dep => dep.replace('@leafer-in/', ''))
      )
      if (allDeps.includes('@leafer-ui/interface')) {
        selectedPlugins.add('interface')
      }

      try {
        result = await prompts(
          [
            {
              name: 'sceneSelect',
              type: 'select',
              message: promptMessage.sceneSelect.message,
              choices: promptMessage.sceneSelect.choices,
              initial: Math.max(
                promptMessage.sceneSelect.choices
                  .map(item => item.value)
                  .indexOf(selectedScene),
                0
              )
            },
            {
              name: 'leaferInSelect',
              type: 'multiselect',
              message: promptMessage.leaferInSelect.message,
              choices: prev =>
                handlePluginChoices(
                  prev,
                  promptMessage.leaferInSelect.choices,
                  Array.from(selectedPlugins)
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
      const scene = result.sceneSelect || 'ui'
      dependencies.push(getScenePackage(scene, platform))
      if (scene === 'editor') {
        excludePlugin = editorIncludes
      } else if (scene === 'game') {
        excludePlugin = [...gameIncludes]
        if (platform === 'node') {
          excludePlugin.push('export')
        }
      } else if (scene === 'full') {
        excludePlugin = LeaferInPlugins
      }

      // Exclude plugins if necessary
      if (result.leaferInSelect.length) {
        result.leaferInSelect
          .filter(item => !excludePlugin.includes(item))
          .map(item => {
            if (item === 'interface') {
              devDependencies.push(`@leafer-ui/interface`)
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
  choices.forEach(item => {
    if (prev === 'editor' && editorIncludes.includes(item.value)) {
      item.selected = true
    }
    if (selectedPlugins.includes(item.value)) {
      item.selected = true
    }
  })

  return choices
}

function getSceneFromDeps(deps: string[]) {
  if (deps.some(dep => dep === 'leafer' || dep.startsWith('@leafer/'))) {
    return 'full'
  }
  if (
    deps.some(dep => dep === 'leafer-editor' || dep.startsWith('@leafer-editor/'))
  ) {
    return 'editor'
  }
  if (
    deps.some(dep => dep === 'leafer-game' || dep.startsWith('@leafer-game/'))
  ) {
    return 'game'
  }
  if (
    deps.some(dep => dep === 'leafer-draw' || dep.startsWith('@leafer-draw/'))
  ) {
    return 'draw'
  }
  if (
    deps.some(dep => dep === 'leafer-ui' || dep.startsWith('@leafer-ui/'))
  ) {
    return 'ui'
  }
  return 'ui'
}

function getPlatformFromDeps(deps: string[]) {
  if (
    deps.some(dep =>
      dep.startsWith('@leafer-ui/worker') ||
      dep.startsWith('@leafer-draw/worker') ||
      dep.startsWith('@leafer-game/worker') ||
      dep.startsWith('@leafer-editor/worker') ||
      dep.startsWith('@leafer/worker')
    )
  ) {
    return 'worker'
  }
  if (
    deps.some(dep =>
      dep.startsWith('@leafer-ui/node') ||
      dep.startsWith('@leafer-draw/node') ||
      dep.startsWith('@leafer-game/node') ||
      dep.startsWith('@leafer-editor/node') ||
      dep.startsWith('@leafer/node')
    )
  ) {
    return 'node'
  }
  if (
    deps.some(dep =>
      dep.startsWith('@leafer-ui/miniapp') ||
      dep.startsWith('@leafer-draw/miniapp') ||
      dep.startsWith('@leafer-game/miniapp') ||
      dep.startsWith('@leafer-editor/miniapp') ||
      dep.startsWith('@leafer/miniapp')
    )
  ) {
    return 'miniapp'
  }
  return 'web'
}

function getScenePackage(scene: string, platform: string) {
  const isWeb = platform === 'web'
  if (scene === 'draw') {
    return isWeb ? 'leafer-draw' : `@leafer-draw/${platform}`
  }
  if (scene === 'game') {
    return isWeb ? 'leafer-game' : `@leafer-game/${platform}`
  }
  if (scene === 'editor') {
    return isWeb ? 'leafer-editor' : `@leafer-editor/${platform}`
  }
  if (scene === 'full') {
    return isWeb ? 'leafer' : `@leafer/${platform}`
  }
  return isWeb ? 'leafer-ui' : `@leafer-ui/${platform}`
}
