import { describe, it, expect } from 'vitest'
import { resolve } from 'node:path'
import { readdirSync } from 'node:fs'
import en from '../prompt/en-US.json'

const compareWithEn = readdirSync(resolve(__dirname, '../prompt')).filter((file) => {
  return file.endsWith('.json') && !file.startsWith('en-US')
})
const defaultKeys = getKeys(en)

describe('prompt message should include all keys', () => {
  compareWithEn.forEach((locale) => {
    it(`for ${locale}`, () => {
      expect(getKeys(require(`../prompt/${locale}`))).toEqual(defaultKeys)
    })
  })
})


function getKeys(obj: any, path = '', result: string[] = []) {
  for (let key in obj) {
    if (typeof obj[key] === 'object') {
      getKeys(obj[key], path ? `${path}.${key}` : key, result)
    } else {
      result.push(path ? `${path}.${key}` : key)
    }
  }
  return result
}