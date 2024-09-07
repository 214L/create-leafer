export function isValidPackageName(projectName) {
  return /^(leafer-[a-z0-9-~][a-z0-9-._~]*|@[a-z0-9-*~][a-z0-9-*._~]*\/leafer-x[a-z0-9-._~]*)$/.test(
    projectName
  )
}

export function toValidPackageName(projectName) {
  let inputName = projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z0-9-~]+/g, '-')
  const regex = /^(leafer-x|@[a-zA-Z0-9_-]+\/leafer-x)/
  if (regex.test(inputName)) {
    return inputName
  } else {
    return 'leafer-x-'
  }
}
export function getGlobalName(str) {
  if (str.startsWith('@')) {
    str = str.replace(/^@[^/]+\//, '')
  }
  if (str.startsWith('leafer-x')) {
    str = str.replace('leafer-x', '')
  } else if (str.startsWith('leafer-')) {
    str = str.replace('leafer-', '')
  }

  const parts = str.split('-')

  return (
    'LeaferX.' +
    parts
      .map((part, index) => {
        if (index > 0 || parts.length > 1) {
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        }
        return part.toLowerCase()
      })
      .join('')
  )
}
