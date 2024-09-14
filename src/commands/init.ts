import path from 'node:path'
import { Command } from 'commander'
import { z } from 'zod'
import fs, { existsSync } from 'fs-extra'
import { red } from 'kolorist'
import { getPackageManager } from '../../utils/index'
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

      //check cwd exist
      if (!existsSync(cwd)) {
        console.log(red(`The path ${cwd} does not exist. Please try again.`))
        process.exit(1)
      }

      //check package.json exist
      if (!fs.existsSync(path.resolve(cwd, 'package.json'))) {
        console.log(
          red(
            `No package.json file found in ${cwd}. Please initialize your project first.`
          )
        )
      }

      //get package manager
      const agent = await getPackageManager(cwd)
      //check existing leafer package

      //prompt choose leafer plugin

      //write file

      //prompt start project
    } catch (error) {
    }
  })
