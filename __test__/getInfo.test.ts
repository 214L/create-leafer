/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { getLeaferVersion, getNpmRegistry } from '../utils/index'
import { execSync } from 'node:child_process'

global.fetch = vi.fn()

vi.mock('node:child_process', () => ({
  execSync: vi.fn()
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
  const defaultVersion = '2.0.0'
  const mockResponseData = { version: '2.0.0' }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return version from npm show if execSync succeeds', async () => {
    const mockExec = execSync as unknown as Mock
    mockExec.mockReturnValueOnce(Buffer.from('2.1.0'))

    const version = await getLeaferVersion()

    expect(version).toBe('2.1.0')
    expect(execSync).toHaveBeenCalledWith('npm show leafer version')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('should use Promise.any when execSync fails', async () => {
    const mockExec = execSync as unknown as Mock
    mockExec.mockImplementationOnce(() => {
      throw new Error('npm show failed')
    })
    const promiseAnySpy = vi.spyOn(Promise, 'any')
    const mockFetch = fetch as Mock
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponseData
    } as Response)

    const version = await getLeaferVersion()

    expect(version).toBe('2.0.0')
    expect(promiseAnySpy).toHaveBeenCalled()
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('leafer/latest'),
      expect.any(Object)
    )
    promiseAnySpy.mockRestore()
  })

  it('should fallback sequentially when Promise.any is unavailable', async () => {
    const originalPromiseAny = Promise.any
    ;(Promise as typeof Promise & { any?: typeof Promise.any }).any = undefined
    const mockExec = execSync as unknown as Mock
    mockExec.mockImplementationOnce(() => {
      throw new Error('npm show failed')
    })
    const mockFetch = fetch as Mock
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponseData
    } as Response)

    let version = ''
    try {
      version = await getLeaferVersion()
    } finally {
      ;(Promise as typeof Promise & { any?: typeof Promise.any }).any =
        originalPromiseAny
    }

    expect(version).toBe('2.0.0')
    expect(fetch).toHaveBeenCalled()
    expect(execSync).toHaveBeenCalledWith('npm show leafer version')
  })

  it('should return default version if all requests fail', async () => {
    const mockExec = execSync as unknown as Mock
    mockExec.mockImplementationOnce(() => {
      throw new Error('npm show failed')
    })
    const mockFetch = fetch as Mock
    mockFetch.mockRejectedValue(new Error('Request failed'))

    const version = await getLeaferVersion()

    expect(version).toBe(defaultVersion)
    expect(fetch).toHaveBeenCalled()
    expect(execSync).toHaveBeenCalledWith('npm show leafer version')
  })
})
