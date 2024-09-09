import * as fs from 'node:fs'
import * as path from 'node:path'
import process from 'node:process'
import prompts from 'prompts'
import { red, gray, bold, lightGreen } from 'kolorist'
import ora from 'ora'
import { Command } from 'commander'

import {
  getBanners,
  getLeaferVersion,
  getPrompt,
  canSkipOverwriteOption,
  emptyDirectory,
  isValidPackageName,
  toValidPackageName,
  renderTemplate,
  getUser,
  getGlobalName
} from '../../utils/index'

export const plugin = new Command()
  .name('plugin')
  .description('Create a LeaferX project')
  //
  .action(async opts => {
    const promptMessage = getPrompt()
    let leaferVersion = await getLeaferVersion()
    let banners = getBanners(promptMessage.language)
    console.log()
    console.log(banners.startingBanner)
    console.log()
    let targetDir = ''
    let result: {
      projectName?: string
      shouldOverwrite?: boolean
      packageName?: string
      supportPlatforms?: string[]
    } = {}

    try {
      result = await prompts(
        [
          {
            name: 'projectName',
            type: 'text',
            message: promptMessage.projectName.message,
            initial: 'leafer-',
            onState: state =>
              (targetDir = String(state.value).trim() || 'leafer-')
          },
          {
            name: 'shouldOverwrite',
            type: () => (canSkipOverwriteOption(targetDir) ? null : 'toggle'),
            message: () => {
              const dirForPrompt =
                targetDir === '.'
                  ? promptMessage.shouldOverwrite.dirForPrompts.current
                  : `${promptMessage.shouldOverwrite.dirForPrompts.target} "${targetDir}"`

              return `${dirForPrompt} ${promptMessage.shouldOverwrite.message}`
            },
            initial: true,
            active: promptMessage.defaultToggleOptions.active,
            inactive: promptMessage.defaultToggleOptions.inactive
          },
          {
            name: 'overwriteChecker',
            type: (prev, values) => {
              if (values.shouldOverwrite === false) {
                throw new Error(
                  red('✖') + ` ${promptMessage.errors.operationCancelled}`
                )
              }
              return null
            }
          },
          {
            name: 'packageName',
            type: () => (isValidPackageName(targetDir) ? null : 'text'),
            message: `${promptMessage.pluginPackageName.message}\n${gray(
              promptMessage.pluginPackageName.hint
            )}`,
            initial: () => toValidPackageName(targetDir),
            validate: dir =>
              isValidPackageName(dir) ||
              promptMessage.pluginPackageName.invalidMessage
          },
          {
            name: 'supportPlatforms',
            type: 'multiselect',
            message: promptMessage.supportPlatforms.message,
            choices: [
              { title: 'web', value: 'web', selected: true },
              { title: 'worker', value: 'worker', selected: true },
              { title: 'node', value: 'node', selected: true },
              { title: 'miniapp', value: 'miniapp', selected: true }
            ],
            hint: promptMessage.supportPlatforms.hint,
            instructions: false,
            min: 1,
            max: 4
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

    const {
      projectName,
      packageName = projectName ?? 'leafer-',
      shouldOverwrite,
      supportPlatforms
    } = result

    const cwd = process.cwd()
    const root = path.join(cwd, targetDir)
    const author = getUser()
    let globalName = getGlobalName(packageName)
    //handle directory
    if (fs.existsSync(root) && shouldOverwrite) {
      const spinner = ora('emptying dir...').start()
      emptyDirectory(root)
      spinner.succeed('emptying dir succeed.')
    } else if (!fs.existsSync(root)) {
      fs.mkdirSync(root)
    }

    //handle package.json
    const pkg = {
      name: packageName,
      version: '0.0.0',
      author
    }
    
    fs.writeFileSync(
      path.resolve(root, 'package.json'),
      JSON.stringify(pkg, null, 2)
    )

    //handle template
    const templateRoot = path.resolve(__dirname, 'template')
    const render = function render(templateName) {
      const templateDir = path.resolve(templateRoot, templateName)
      renderTemplate(templateDir, root)
    }
    // Render base template
    render('leaferx/base')

    // handle platform supportPlatforms
    let rollupConfigPath = path.resolve(root, 'rollup.config.js')
    // handle rollup.config.js
    if (fs.existsSync(rollupConfigPath)) {
      const existing = fs.readFileSync(rollupConfigPath, 'utf8')
      let modifiedData = existing
        .replace(
          /const globalName = 'LeaferX.selector'/,
          `const globalName = '${globalName}'`
        )
        .replace(
          /const supportPlatforms = \['web','worker','node','miniapp'\]/,
          `const supportPlatforms = ${JSON.stringify(supportPlatforms)}`
        )
      fs.writeFileSync(rollupConfigPath, modifiedData)
    }
    //handle package.json
    let packagePath = path.resolve(root, 'package.json')
    if (fs.existsSync(packagePath)) {
      const existing = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
      existing.dependencies['@leafer-ui/core'] = `^${leaferVersion}`
      existing.devDependencies['leafer-ui'] = `^${leaferVersion}`
      existing.name=pkg.name;
      existing.author=pkg.author;
      fs.writeFileSync(packagePath, JSON.stringify(existing, null, 2))
    }
    //finish
    console.log(`\n${promptMessage.infos.done}\n`)
    if (root !== cwd) {
      const cdProjectName = path.relative(cwd, root)
      console.log(
        `  ${bold(
          lightGreen(
            `cd ${
              cdProjectName.includes(' ') ? `"${cdProjectName}"` : cdProjectName
            }`
          )
        )}`
      )
    }
    console.log(`  ${bold(lightGreen('npm install'))}`)
    console.log(`  ${bold(lightGreen('npm run start'))}`)
    console.log()
    console.log(banners.endingBanner)
    console.log()
  })
