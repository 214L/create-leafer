import * as fs from 'node:fs'
import * as path from 'node:path'
import { execSync } from 'node:child_process'
import { detect } from 'package-manager-detector'

export function getNpmRegistry() {
  const registry = process.env.npm_config_registry
  // 如果没有设置用户级别的 registry，返回默认值
  return registry || 'https://registry.npmjs.org/'
}
export function getPrompt() {
  const shellLocale =
    process.env.LC_ALL ||
    process.env.LC_MESSAGES ||
    process.env.LANG ||
    Intl.DateTimeFormat().resolvedOptions().locale ||
    'en-US' // Default fallback
  let locale = shellLocale.split('.')[0].replace('_', '-')
  locale = locale.startsWith('en') ? 'en-US' : 'zh-Hans'
  const promptRoot = path.resolve(__dirname, 'prompt-message')
  const languageFilePath = path.resolve(promptRoot, `${locale}.json`)
  const doesLanguageExist = fs.existsSync(languageFilePath)

  const prompt = doesLanguageExist
    ? require(languageFilePath)
    : require(path.resolve(promptRoot, 'en-US.json'))

  return prompt
}

export function getUser() {
  let userName = getGitUsername()
    ? getGitUsername()
    : getNpmUsername()
    ? getNpmUsername()
    : ''
  let emailAddress = getGitEmailAddress() ? ` <${getGitEmailAddress()}>` : ''
  return userName + emailAddress
}

function getNpmUsername() {
  try {
    return execSync('npm whoami', { encoding: 'utf8' }).trim()
  } catch (err) {
    return null
  }
}

function getGitUsername() {
  try {
    return execSync('git config --get user.name', { encoding: 'utf8' }).trim()
  } catch (err) {
    return null
  }
}

function getGitEmailAddress() {
  try {
    return execSync('git config --get user.email', { encoding: 'utf8' }).trim()
  } catch (err) {
    return null
  }
}
/**
 * @description get package manager
 * @param targetDir target directory
 * @returns  package manager agent
 */
export async function getPackageManager(
  targetDir: string
): Promise<'yarn' | 'pnpm' | 'bun' | 'npm'> {
  const { agent } = await detect({ cwd: targetDir })
  console.log(agent)

  if (agent === 'yarn@berry') return 'yarn'
  if (agent === 'pnpm@6') return 'pnpm'
  if (agent === 'bun') return 'bun'

  return agent ?? 'npm'
}
