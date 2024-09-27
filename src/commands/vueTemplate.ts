import * as fs from 'node:fs'
import * as path from 'node:path'
import process from 'node:process'
import prompts from 'prompts'
import { red, gray, bold, lightGreen,green,yellow,blue,cyan } from 'kolorist'
import { Command } from 'commander'
import ora from 'ora'
import {
  getBanners,
  getLeaferVersion,
  getPrompt,
  canSkipOverwriteOption,
  emptyDirectory,
  isValidPackageName,
  toValidPackageName,
  renderTemplate,
  getUser
} from '../../utils/index'

export const vueTemplate = new Command()
  .name('vue-template')
  .description('generate a leafer+vue template project powered by vite')
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

    type ColorFunc = (str: string | number) => string

    type Framework = {
      name: string
      display: string
      color: ColorFunc
      variants: FrameworkVariant[]
    }
    type FrameworkVariant = {
      name: string
      display: string
      color: ColorFunc
      customCommand?: string
    }
    
    const FRAMEWORKS: Framework[] = [
      {
        name: 'vanilla',
        display: 'Vanilla',
        color: yellow,
        variants: [
          {
            name: 'vanilla-ts',
            display: 'TypeScript',
            color: blue,
          },
          {
            name: 'vanilla',
            display: 'JavaScript',
            color: yellow,
          },
        ],
      },
      {
        name: 'vue',
        display: 'Vue',
        color: green,
        variants: [
          {
            name: 'vue-ts',
            display: 'TypeScript',
            color: blue,
          },
          {
            name: 'vue',
            display: 'JavaScript',
            color: yellow,
          }
        ],
      },
      {
        name: 'react',
        display: 'React',
        color: cyan,
        variants: [
          {
            name: 'react-ts',
            display: 'TypeScript',
            color: blue,
          },
          {
            name: 'react',
            display: 'JavaScript',
            color: yellow,
          },
        ],
      },
    ]
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
            type: () => (isValidPackageName(targetDir) ? null : 'text'),
            message: `${promptMessage.packageName.message}\n${gray(
              promptMessage.packageName.hint
            )}`,
            initial: () => toValidPackageName(targetDir),
            validate: dir =>
              isValidPackageName(dir) ||
              promptMessage.packageName.invalidMessage
          },
          {
            type:'select',
            name: 'framework',
            message:promptMessage.framework.message,
            initial: 0,
            choices: FRAMEWORKS.map((framework) => {
              const frameworkColor = framework.color
              return {
                title: frameworkColor(framework.display || framework.name),
                value: framework,
              }
            }),
          },
          {
            type: (framework: Framework) =>
              framework && framework.variants ? 'select' : null,
            name: 'variant',
            message: 'Select a variant:',
            choices: (framework: Framework) =>
              framework.variants.map((variant) => {
                const variantColor = variant.color
                return {
                  title: variantColor(variant.display || variant.name),
                  value: variant.name,
                }
              }),
          },
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
      shouldOverwrite
    } = result

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
    render('leafer/vue')

    //handle leafer version
    let packagePath = path.resolve(root, 'package.json')
    if (fs.existsSync(packagePath)) {
      const existing = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
      existing.name = pkg.name
      existing.author = pkg.author
      //handle leafer version
      for (const key in existing.dependencies) {
        if (Object.prototype.hasOwnProperty.call(existing.dependencies, key)) {
          if (key !== 'vue') {
            existing.dependencies[key] = `^${leaferVersion}`
          }
        }
      }
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
