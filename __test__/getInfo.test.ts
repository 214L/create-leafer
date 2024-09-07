/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { getLeaferVersion, getNpmRegistry } from '../utils/getUserInfo'

global.fetch = vi.fn()

vi.mock('./leafer', () => ({
  getNpmRegistry: vi.fn()
}))

describe('getNpmRegistry', () => {
  it('should return the value of npm_config_registry from environment variables', () => {
    process.env.npm_config_registry = 'https://custom-registry.com/'
    const registry = getNpmRegistry()
    expect(registry).toBe('https://custom-registry.com/')
  })

  it('should return the default registry if npm_config_registry is not set', () => {
    delete process.env.npm_config_registry
    const registry = getNpmRegistry()
    expect(registry).toBe('https://registry.npmjs.org/')
    process.env.npm_config_registry = 'https://registry.npmjs.org/'
  })
})

describe('getLeaferVersion', () => {
  const defaultVersion = '1.0.2'
  const mockPrimaryRegistry = 'https://registry.npmjs.org/'
  const mockFallbackRegistries = [
    'https://registry.npmjs.org/',
    'https://registry.npmmirror.com',
    'https://mirrors.huaweicloud.com/repository/npm/'
  ]
  const mockResponseData = { version: '1.0.2' }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return version from primary registry if the request is successful', async () => {
    // Mock successful response from primary registry
    let mockFetch = fetch as Mock
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponseData
    } as Response)

    const version = await getLeaferVersion()

    expect(version).toBe('1.0.2')
    expect(fetch).toHaveBeenCalledWith(
      `${mockPrimaryRegistry}leafer/latest`,
      expect.objectContaining({
        signal: expect.any(AbortSignal)
      })
    )
  })

  it('should return version from fallback registry if primary request fails', async () => {
    // Mock getNpmRegistry to return the primary registry URL
    vi.mock('./leafer', () => ({
      getNpmRegistry: () => mockPrimaryRegistry
    }))

    // Mock failed response from primary registry
    
    let mockFetch = fetch as Mock
    mockFetch.mockResolvedValueOnce(
      new Error('Primary registry failed')
    )

    // Mock successful response from the first fallback registry
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponseData
    } as Response)

    const version = await getLeaferVersion()

    expect(version).toBe('1.0.2')
    expect(fetch).toHaveBeenCalledWith(
      `${mockFallbackRegistries[0]}leafer/latest`,
      expect.any(Object)
    )
  })

  it('should return default version if all requests fail', async () => {
    // Mock getNpmRegistry to return the primary registry URL
    vi.mock('./leafer', () => ({
      getNpmRegistry: () => mockPrimaryRegistry
    }))

    // Mock failed responses from primary and all fallback registries
    let mockFetch = fetch as Mock
    mockFetch.mockResolvedValueOnce(new Error('Request failed'))

    const version = await getLeaferVersion()

    expect(version).toBe(defaultVersion)
    expect(fetch).toHaveBeenCalledTimes(4)
  })

  it('should handle timeouts and return version from fallback registry', async () => {
    // Mock timeout response from primary registry
    let mockFetch = fetch as Mock
    mockFetch.mockResolvedValueOnce(
      () =>
        new Promise(
          (_, reject) => setTimeout(() => reject(new Error('Timeout')), 0) // Shortened timeout for faster testing
        )
    )

    // Mock successful response from the first fallback registry
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ version: '1.0.2' })
    } as Response)

    // Mock additional fallback responses if needed
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ version: '1.0.2' })
    } as Response)

    const version = await getLeaferVersion()

    console.log('Fetch calls:', mockFetch.mock.calls)

    expect(version).toBe('1.0.2')
    expect(fetch).toHaveBeenCalledTimes(4) // Adjust based on expected number of calls
  }, 10) // Increase timeout for this test
})
