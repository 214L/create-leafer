import * as fs from 'node:fs'
import * as path from 'node:path'
import process from 'node:process'
import prompts from 'prompts'
import { red, gray, bold, lightGreen } from 'kolorist'
import { Command } from 'commander'
import ora from 'ora'
import {
  getBanners,
  getLeaferVersion,
  getPrompt,
  canSkipOverwriteOption,
  emptyDirectory,
  isValidNpmPackageName,
  renderTemplate,
  getUser,
  FRAMEWORKS,
  Framework
} from '../../utils/index'

export const template = new Command()
  .name('template')
  .description('generate template project powered by vite')
  .option(
    '-c, --cwd <cwd>',
    'the working directory. defaults to the current directory.',
    process.cwd()
  )
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
      variant?: string
    } = {}

    try {
      result = await prompts(
        [
          {
            name: 'projectName',
            type: 'text',
            message: promptMessage.projectName.message,
            initial: 'leafer-project',
            onState: state =>
              (targetDir = String(state.value).trim() || 'leafer-project')
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
            type: 'text',
            message: `${promptMessage.packageName.message}\n${gray(
              promptMessage.packageName.hint
            )}`,
            initial: (_, values) => values.projectName,
            validate: value => {
              const normalized = String(value || '').trim()
              if (!normalized) return true
              return (
                isValidNpmPackageName(normalized) ||
                promptMessage.packageName.invalidMessage
              )
            }
          },
          {
            type: 'select',
            name: 'framework',
            message: promptMessage.framework.message,
            initial: 0,
            choices: FRAMEWORKS.map(framework => {
              const frameworkColor = framework.color
              return {
                title: frameworkColor(framework.display || framework.name),
                value: framework
              }
            })
          },
          {
            type: (framework: Framework) =>
              framework && framework.variants ? 'select' : null,
            name: 'variant',
            message: 'Select a variant:',
            choices: (framework: Framework) =>
              framework.variants.map(variant => {
                const variantColor = variant.color
                return {
                  title: variantColor(variant.display || variant.name),
                  value: variant.name
                }
              })
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
      packageName,
      shouldOverwrite,
      variant
    } = result

    const resolvedPackageName =
      (packageName && packageName.trim()) ||
      projectName ||
      'leafer-project'

    const cwd = process.cwd()
    const root = path.join(cwd, targetDir)
    const author = getUser()
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
      name: resolvedPackageName,
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
    if (variant) {
      // Convert variant name (e.g., 'vanilla-js') to template path (e.g., 'vanilla/js')
      const templatePath = variant.replace('-', '/')
      render(`leafer/${templatePath}`)
    } else {
      throw new Error('No template variant selected')
    }

    const isLeaferPackage = (name: string) =>
      name === 'leafer' ||
      name.startsWith('leafer-') ||
      name.startsWith('@leafer-') ||
      name.startsWith('@leafer/')

    const updateLeaferDeps = (deps: Record<string, string> | undefined) => {
      if (!deps) return
      Object.keys(deps).forEach(key => {
        if (isLeaferPackage(key)) {
          deps[key] = `^${leaferVersion}`
        }
      })
    }

    //handle leafer version
    let packagePath = path.resolve(root, 'package.json')
    if (fs.existsSync(packagePath)) {
      const existing = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
      existing.name = pkg.name
      existing.author = pkg.author
      //handle leafer version
      updateLeaferDeps(existing.dependencies)
      updateLeaferDeps(existing.devDependencies)
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
    console.log(`  ${bold(lightGreen('npm run dev'))}`)
    console.log()
    console.log(banners.endingBanner)
    console.log()
  })
