import * as fs from 'node:fs'
import * as path from 'node:path'
import { green, yellow, blue, cyan } from 'kolorist'
export function renderTemplate(src, dest) {
  const stats = fs.statSync(src)

  if (stats.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true })
    for (const file of fs.readdirSync(src)) {
      renderTemplate(path.resolve(src, file), path.resolve(dest, file))
    }
    return
  }

  const filename = path.basename(src)

  if (filename === 'package.json' && fs.existsSync(dest)) {
    const existing = JSON.parse(fs.readFileSync(dest, 'utf8'))

    const newPackage = JSON.parse(fs.readFileSync(src, 'utf8'))

    const pkg = deepMerge(existing, newPackage)

    fs.writeFileSync(dest, JSON.stringify(pkg, null, 2) + '\n')
    return
  }

  if (filename.startsWith('_')) {
    // rename
    dest = path.resolve(path.dirname(dest), filename.replace(/^_/, '.'))
  }

  if (filename === '_gitignore' && fs.existsSync(dest)) {
    const existing = fs.readFileSync(dest, 'utf8')
    const newGitignore = fs.readFileSync(src, 'utf8')
    fs.writeFileSync(dest, existing + '\n' + newGitignore)
    return
  }

  fs.copyFileSync(src, dest)
}

const isObject = val => val && typeof val === 'object'
const mergeArrayWithDedupe = (a, b) => Array.from(new Set([...a, ...b]))
function deepMerge(target, obj) {
  for (const key of Object.keys(obj)) {
    const oldVal = target[key]
    const newVal = obj[key]
    if (Array.isArray(oldVal) && Array.isArray(newVal)) {
      target[key] = mergeArrayWithDedupe(oldVal, newVal)
    } else if (isObject(oldVal) && isObject(newVal)) {
      target[key] = deepMerge(newVal, oldVal)
    } else {
      target[key] = newVal
    }
  }
  return target
}

type ColorFunc = (str: string | number) => string

export type Framework = {
  name: string
  display: string
  color: ColorFunc
  variants: FrameworkVariant[]
}
type FrameworkVariant = {
  name: string
  display: string
  color: ColorFunc
  customCommand?: string
}

export const FRAMEWORKS: Framework[] = [
  {
    name: 'vanilla',
    display: 'Vanilla',
    color: yellow,
    variants: [
      {
        name: 'vanilla-ts',
        display: 'TypeScript',
        color: blue
      },
      {
        name: 'vanilla-js',
        display: 'JavaScript',
        color: yellow
      }
    ]
  },
  {
    name: 'vue',
    display: 'Vue',
    color: green,
    variants: [
      {
        name: 'vue-ts',
        display: 'TypeScript',
        color: blue
      },
      {
        name: 'vue-js',
        display: 'JavaScript',
        color: yellow
      }
    ]
  },
  {
    name: 'react',
    display: 'React',
    color: cyan,
    variants: [
      {
        name: 'react-ts',
        display: 'TypeScript',
        color: blue
      },
      {
        name: 'react-js',
        display: 'JavaScript',
        color: yellow
      }
    ]
  }
]
