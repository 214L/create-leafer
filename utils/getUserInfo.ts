import * as fs from 'node:fs'
import * as path from 'node:path'
import { execSync } from 'node:child_process'

interface NpmRegistryResponse {
  version: string
  [key: string]: any
}

export async function getLeaferVersion(): Promise<string | undefined> {
  const defaultVersion = '1.0.2'
  const timeout = 10000 // 10 seconds
  const fallbackRegistries = [
    'https://registry.npmjs.org/',
    'https://registry.npmmirror.com',
    'https://mirrors.huaweicloud.com/repository/npm/'
  ]
  return execSync(`npm show leafer version`).toString().trim()
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

  try {
    const registry = getNpmRegistry()
    const response = await fetchWithTimeout(`${registry}leafer/latest`, timeout)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = (await response.json()) as NpmRegistryResponse
    return data.version
  } catch (error) {
    console.error(
      'Failed to fetch Leafer version from primary registry:',
      error
    )

    // Fallback logic with concurrent requests
    const fallbackPromises = fallbackRegistries.map(async fallbackRegistry => {
      try {
        const fallbackResponse = await fetchWithTimeout(
          `${fallbackRegistry}leafer/latest`,
          timeout
        )

        if (!fallbackResponse.ok) {
          throw new Error(`HTTP error! status: ${fallbackResponse.status}`)
        }

        const fallbackData =
          (await fallbackResponse.json()) as NpmRegistryResponse
        return fallbackData.version
      } catch (fallbackError) {
        console.error(
          `Failed to fetch Leafer version from fallback registry ${fallbackRegistry}:`,
          fallbackError
        )
        return undefined
      }
    })

    // Wait for the first successful response or all failures
    const firstSuccessful = await Promise.race(fallbackPromises.filter(p => p))

    if (firstSuccessful) {
      return firstSuccessful
    }

    console.error(
      'All fallback attempts failed. Process continues with default version:',
      defaultVersion
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
