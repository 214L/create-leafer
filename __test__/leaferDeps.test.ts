/// <reference types="vitest" />
import { describe, it, expect } from 'vitest'
import { isLeaferPackage, updateLeaferDeps } from '../utils/index'

describe('isLeaferPackage', () => {
  it('should detect leafer-related packages', () => {
    expect(isLeaferPackage('leafer')).toBe(true)
    expect(isLeaferPackage('leafer-ui')).toBe(true)
    expect(isLeaferPackage('@leafer-in/flow')).toBe(true)
    expect(isLeaferPackage('@leafer/worker')).toBe(true)
    expect(isLeaferPackage('react')).toBe(false)
    expect(isLeaferPackage('@other/leafer')).toBe(false)
  })
})

describe('updateLeaferDeps', () => {
  it('should update only leafer-related dependencies', () => {
    const deps = {
      'leafer-ui': '^1.0.0',
      '@leafer-in/flow': '^1.0.0',
      '@leafer/worker': '^1.0.0',
      '@leafer-ui/core': '^1.0.0',
      react: '^18.0.0',
      '@other/pkg': '^1.0.0'
    }

    updateLeaferDeps(deps, '2.0.0')

    expect(deps['leafer-ui']).toBe('^2.0.0')
    expect(deps['@leafer-in/flow']).toBe('^2.0.0')
    expect(deps['@leafer/worker']).toBe('^2.0.0')
    expect(deps['@leafer-ui/core']).toBe('^2.0.0')
    expect(deps.react).toBe('^18.0.0')
    expect(deps['@other/pkg']).toBe('^1.0.0')
  })

  it('should handle empty dependencies', () => {
    updateLeaferDeps(undefined, '2.0.0')
  })
})
