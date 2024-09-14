import * as fs from 'node:fs'
import * as path from 'node:path'
import { execSync } from 'node:child_process'
import { detect } from 'package-manager-detector/detect'
import { DetectResult } from 'package-manager-detector'
interface NpmRegistryResponse {
  version: string
  [key: string]: any
}

export async function getLeaferVersion(): Promise<string> {
  const defaultVersion = '1.0.2'
  const timeout = 10000 // 10 seconds
  const fallbackRegistries = [
    'https://registry.npmjs.org/',
    'https://registry.npmmirror.com',
    'https://mirrors.huaweicloud.com/repository/npm/'
  ]

  // Function to get version using npm show
  const getNpmShowVersion = async (): Promise<string> => {
    try {
      return execSync(`npm show leafer version`).toString().trim()
    } catch (error) {
      console.error('Failed to fetch Leafer version using npm show:', error)
      console.error('Now try to fetch version from fallback registries...')

      throw error
    }
  }

  // Function to fetch version from registry
  const fetchWithTimeout = async (
    url: string,
    timeout: number
  ): Promise<Response> => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    try {
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  const fetchVersionFromRegistry = async (
    registry: string
  ): Promise<string> => {
    try {
      const response = await fetchWithTimeout(
        `${registry}leafer/latest`,
        timeout
      )
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = (await response.json()) as { version: string }
      return data.version
    } catch (error) {
      console.error(`Failed to fetch Leafer version from ${registry}:`)
      throw error
    }
  }

  try {
    // Combine both npm show and registry fetches
    const versionPromises = [
      getNpmShowVersion(),
      ...fallbackRegistries.map(registry => fetchVersionFromRegistry(registry))
    ]

    // Wait for the first successful result
    const firstSuccessful = await Promise.any(versionPromises)

    return firstSuccessful
  } catch (error) {
    console.error(
      'All version fetching methods failed, returning default version:',
      error
    )
    return defaultVersion
  }
}

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
