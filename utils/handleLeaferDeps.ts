export function isLeaferPackage(name: string): boolean {
  return (
    name === 'leafer' ||
    name.startsWith('leafer-') ||
    name.startsWith('@leafer-') ||
    name.startsWith('@leafer/')
  )
}

export function updateLeaferDeps(
  deps: Record<string, string> | undefined,
  version: string
) {
  if (!deps) return
  Object.keys(deps).forEach(key => {
    if (isLeaferPackage(key)) {
      deps[key] = `^${version}`
    }
  })
}
