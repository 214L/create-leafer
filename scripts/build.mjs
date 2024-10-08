import * as esbuild from 'esbuild'
import esbuildPluginLicense from 'esbuild-plugin-license'
const { version } = require('../package.json'); 
const CORE_LICENSE = `MIT License

Copyright (c) 2024 214L

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


# The project was inspired by create-vite & create-vue.Thanks for the vue and vite teams for their contributions to the open source ecosystem.

# create-vite license
create-vite is released under the MIT license:

MIT License

Copyright (c) 2019-present, VoidZero Inc. and Vite contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

# create-vue core license

create-vue is released under the MIT license:

MIT License

Copyright (c) 2021-present vuejs

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`

await esbuild.build({
  bundle: true,
  entryPoints: ['index.ts'],
  external: ['prompt-message/*', 'template/*'],
  outfile: 'create-leafer.cjs',
  format: 'cjs',
  platform: 'node',
  target: 'node14',
  define: {
    'process.env.VERSION': JSON.stringify(version), // 注入 version
  },
  plugins: [
    {
      name: 'alias',
      setup({ onResolve, resolve }) {
        onResolve(
          { filter: /^prompts$/, namespace: 'file' },
          async ({ importer, resolveDir }) => {
            // we can always use non-transpiled code since we support 14.16.0+
            const result = await resolve('prompts/lib/index.js', {
              importer,
              resolveDir,
              kind: 'import-statement'
            })
            return result
          }
        )
      }
    },
    esbuildPluginLicense({
      thirdParty: {
        includePrivate: false,
        output: {
          file: 'LICENSE',
          template(allDependencies) {
            // There's a bug in the plugin that it also includes the `create-leafer` package itself
            const dependencies = allDependencies.filter(
              d => d.packageJson.name !== 'create-leafer'
            )
            const licenseText =
              `# create-leafer core license\n\n` +
              `create-leafer is released under the MIT license:\n\n` +
              CORE_LICENSE +
              `\n## Licenses of bundled dependencies\n\n` +
              `The published create-leafer artifact additionally contains code with the following licenses:\n` +
              [
                ...new Set(
                  dependencies.map(dependency => dependency.packageJson.license)
                )
              ].join(', ') +
              '\n\n' +
              `## Bundled dependencies\n\n` +
              dependencies
                .map(dependency => {
                  return (
                    `## ${dependency.packageJson.name}\n\n` +
                    `License: ${dependency.packageJson.license}\n` +
                    `By: ${dependency.packageJson.author?.name}\n` +
                    `Repository: ${dependency.packageJson.repository.url}\n\n` +
                    dependency.licenseText
                      .split('\n')
                      .map(line => (line ? `> ${line}` : '>'))
                      .join('\n')
                  )
                })
                .join('\n\n')

            return licenseText
          }
        }
      }
    })
  ]
})
console.log('build done')
