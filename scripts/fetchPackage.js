import fetch from 'node-fetch';
import fs from 'node:fs'
async function getPackages(scope) {
    const url = `https://registry.npmjs.org/-/v1/search?text=scope:${scope}`;
    const response = await fetch(url);
    const data = await response.json();
    const packages = data.objects.map(pkg => pkg.package.name);
    return packages;
}

async function writePackagesToFile() {
    const leaferUiPackages = await getPackages('leafer-ui');
    const leaferInPackages = await getPackages('leafer-in');
    const leaferEditorPackages = await getPackages('leafer-editor');
    const leaferPackages = await getPackages('leafer');


    const content = {
        '@leafer-ui': leaferUiPackages.reduce((acc, pkg) => {
          acc[pkg] = {};
          return acc;
        }, {}),
        '@leafer-in': leaferInPackages.reduce((acc, pkg) => {
          acc[pkg] = {};
          return acc;
        }, {}),
        '@leafer-editor': leaferEditorPackages.reduce((acc, pkg) => {
          acc[pkg] = {};
          return acc;
        }, {}),
        '@leafer': leaferPackages.reduce((acc, pkg) => {
          acc[pkg] = {};
          return acc;
        }, {})
      };
      

    // 将内容写入文件
    fs.writeFileSync('../src/data/leaferPkgInfo.json', JSON.stringify(content, null, 2), 'utf-8');
}

writePackagesToFile();
