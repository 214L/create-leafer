import * as fs from 'node:fs'
import * as path from 'node:path'
import process from 'node:process'
import prompts from 'prompts'
import * as banners from '../../utils/banners'
import { red, gray, bold, lightGreen } from 'kolorist'
import ora from 'ora'
import { Command } from 'commander'
// import { parseArgs } from 'node:util'
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
export async function create() {
  const promptMessage = getPrompt()
  let leaferVersion = await getLeaferVersion()
  let { startingBanner, endingBanner } = getBanners(promptMessage.language)
  console.log()
  console.log(startingBanner)
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
            isValidPackageName(dir) || promptMessage.packageName.invalidMessage
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
  
}
