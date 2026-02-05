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
  'animate',
  'resize',
  'flow',
  'editor',
  'bright'
]
const LeaferInDependencies = {
  animate: ['color'],
  flow: ['resize'],
  editor: ['resize']
}
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
        process.exit(1);
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
              onRender: createLeaferInSelectRenderHandler(promptMessage),
              instructions: false,
              min: 0,
              max: 20
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
      const platform = result.supportPlatforms || 'web'
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

      //exclude plugin
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
        const textEditorIndex = dependencies.indexOf('@leafer-in/text-editor')
        if (textEditorIndex !== -1) {
          dependencies.splice(textEditorIndex, 1)
          console.log(
            red(
              '/* @leafer-in/text-editor plugin only supports web PC, removed from dependencies */'
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
    choices.forEach(item => {
      if (editorIncludes.includes(item.value)) {
        item.selected = true
      }
    })
  }
  return choices
}

function formatDependencyMessage(template: string, main: string, dep: string) {
  return template
    .replace(/\{main\}/g, main)
    .replace(/\{dep\}/g, dep)
}

function createLeaferInSelectRenderHandler(promptMessage) {
  const template = promptMessage?.leaferInSelect?.dependencyMessage || ''
  let initialized = false
  let lastSelected = new Set<string>()

  return function handleRender() {
    if (!this || !Array.isArray(this.value)) return
    const selected = new Set(
      this.value
        .filter(item => item.selected)
        .map(item => String(item.value))
    )

    const newlySelectedMain = new Set<string>()
    Object.keys(LeaferInDependencies).forEach(main => {
      if (selected.has(main) && !lastSelected.has(main)) {
        newlySelectedMain.add(main)
      }
    })

    Object.entries(LeaferInDependencies).forEach(([main, deps]) => {
      if (!selected.has(main)) return
      deps.forEach(dep => {
        if (!selected.has(dep)) {
          const choice = this.value.find(item => item.value === dep)
          if (choice) {
            choice.selected = true
            selected.add(dep)
            if (initialized && newlySelectedMain.has(main) && template) {
              console.log(formatDependencyMessage(template, main, dep))
            }
          }
        }
      })
    })

    lastSelected = new Set(selected)
    if (!initialized) {
      initialized = true
    }
  }
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
