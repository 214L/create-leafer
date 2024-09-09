import path from 'node:path'
import { Command } from 'commander'
import { z } from 'zod'
import { existsSync } from 'fs-extra'
import { red } from 'kolorist'
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

      if (!existsSync(cwd)) {
        red(`The path ${cwd} does not exist. Please try again.`)
        process.exit(1)
      }
    } catch (error) {
      // handleError(error)
    }
  })
