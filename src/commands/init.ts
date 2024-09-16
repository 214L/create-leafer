import path from 'node:path'
import { Command } from 'commander'
import { z } from 'zod'
import fs, { existsSync } from 'fs-extra'
import prompts from 'prompts'
import { red, lightGreen, bold } from 'kolorist'
import {
  getPrompt,
  getPackageManager,
  getLeaferPackageInfo,
  findLeaferPackage
} from '../../utils/index'
const initOptionsSchema = z.object({
  cwd: z.string(),
  yes: z.boolean(),
  defaults: z.boolean()
})
export const init = new Command()
  .name('init')
  .description('initialize your leafer project and install dependencies')
  .option('-y, --yes', 'skip confirmation prompt.', false)
  .option('-d, --defaults,', 'use default configuration.', false)
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
      //get leafer package enum
      const { LeaferBasePackage, LeaferInPackage } =
        await getLeaferPackageInfo()
      //prompt choose run platform
      let result: {
        supportPlatforms?: string
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
      console.log(result)
      //handle dependencies

      //write file

      //prompt start project
    } catch (error) {}
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
