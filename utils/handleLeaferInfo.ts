import { execSync } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'
const FallbackRegistries = [
  'https://registry.npmjs.org/',
  'https://registry.npmmirror.com',
  'https://mirrors.huaweicloud.com/repository/npm/'
]
interface Package {
  name: string
  version: string
  description: string
}

interface SearchResultObject {
  package: Package
}

interface SearchResponse {
  total: number
  objects: SearchResultObject[]
}

export async function getLeaferVersion(): Promise<string> {
  const defaultVersion = '1.0.2'
  const timeout = 10000 // 10 seconds

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
      ...FallbackRegistries.map(registry => fetchVersionFromRegistry(registry))
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
export async function findLeaferPackage(cwd: string) {
  let packagePath = path.resolve(cwd, 'package.json')
  if (fs.existsSync(packagePath)) {
    const existing = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
    let allDependencies = []
    if (existing.devDependencies) {
      allDependencies.push(...Object.keys(existing.devDependencies))
    }
    if (existing.dependencies) {
      allDependencies.push(...Object.keys(existing.dependencies))
    }
    let leaferDependencies = allDependencies.filter(
      item =>
        Object.keys(LeaferBasePackage).includes[item] ||
        Object.keys(LeaferInPackage).includes(item)
    )
    return leaferDependencies
  }
}
const LeaferBasePackage = {
  'leafer-ui': {},
  '@leafer-ui/worker': {},
  '@leafer-ui/node': {},
  '@leafer-ui/miniapp': {}
}
const LeaferInPackage = {
  'leafer-editor': {
    type: 'save',
    includes: [
      'leafer-ui',
      '@leafer-editor/web',
      '@leafer-in/editor',
      '@leafer-in/view',
      '@leafer-in/scroll',
      '@leafer-in/arrow',
      '@leafer-in/html'
    ]
  },
  'leafer-draw': { type: 'save' },
  '@leafer-in/interface': { type: 'develop' },
  '@leafer-in/editor': { type: 'save' },
  '@leafer-in/html': { type: 'save' },
  '@leafer-in/scroll': { type: 'save' },
  '@leafer-in/arrow': { type: 'save' },
  '@leafer-in/view': { type: 'save' },
  '@leafer-in/state': { type: 'save' },
  '@leafer-in/text-editor': { type: 'save' },
  '@leafer-in/flow': { type: 'save' },
  '@leafer-in/resize': { private: true },
  '@leafer-in/scale': { private: true }
}

export function getLeaferPackageInfo() {
  return { LeaferBasePackage, LeaferInPackage }
}
/**
 * @description fetch with timeout
 * @param url target url
 * @param timeout timeout
 * @returns
 */
async function fetchWithTimeout(
  url: string,
  timeout: number
): Promise<Response> {
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
