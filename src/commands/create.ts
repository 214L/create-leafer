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
  // const promptMessage = getPrompt()
  // let { startingBanner, endingBanner } = printBanner(promptMessage.language)
  // let leaferVersion = await getLeaferVersion()
  // console.log()
  // console.log(startingBanner)
}
