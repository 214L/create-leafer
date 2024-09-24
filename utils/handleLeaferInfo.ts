import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { bold, lightGreen, lightYellow } from 'kolorist';

const FallbackRegistries = [
  'https://registry.npmjs.org/',
  'https://registry.npmmirror.com',
  'https://mirrors.huaweicloud.com/repository/npm/',
];

interface Package {
  name: string;
  version: string;
  description: string;
}

interface SearchResultObject {
  package: Package;
}

interface SearchResponse {
  total: number;
  objects: SearchResultObject[];
}

const LeaferBasePackage = {
  'leafer-ui': {},
  '@leafer-ui/worker': {},
  '@leafer-ui/node': {},
  '@leafer-ui/miniapp': {},
  '@leafer-ui/draw': {},
  '@leafer-ui/interface': {},
  '@leafer-ui/core': {},
  '@leafer-ui/partner': {},
  '@leafer-ui/event': {},
  '@leafer-ui/interaction-web': {},
  '@leafer-ui/external': {},
  '@leafer-ui/data': {},
  '@leafer-ui/display-module': {},
  '@leafer-ui/interaction': {},
  '@leafer-ui/decorator': {},
  '@leafer-ui/display': {},
  '@leafer-ui/export': {},
  '@leafer-ui/type': {},
  '@leafer-ui/web': {},
  '@leafer-ui/render': {},
  '@leafer-ui/bounds': {},
  '@leafer-ui/effect': {},
  '@leafer-ui/paint': {},
  '@leafer-ui/color': {},
};

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
      '@leafer-in/html',
    ],
  },
  'leafer-draw': { type: 'save' },
  '@leafer-in/interface': { type: 'develop' },
  '@leafer-in/editor': { type: 'save' },
  '@leafer-in/html': { type: 'save' },
  '@leafer-in/scroll': { type: 'save' },
  '@leafer-in/arrow': { type: 'save' },
  '@leafer-in/view': { type: 'save' },
  '@leafer-in/text-editor': { type: 'save' },
  '@leafer-in/flow': { type: 'save' },
  '@leafer-in/animate': { type: 'save' },
  '@leafer-in/robot': { type: 'save' },
  '@leafer-in/state': { type: 'save' },
  '@leafer-in/resize': { private: true },
  '@leafer-in/scale': { private: true },
};

const baseEditorInfo = {
  '@leafer-editor/partner': {},
  '@leafer-editor/web': {},
  '@leafer-editor/canvaskit': {},
  '@leafer-editor/miniapp': {},
  '@leafer-editor/worker': {},
  '@leafer-editor/node': {},
};

const baseInfo = {
  '@leafer/core': {},
  '@leafer/math': {},
  '@leafer/debug': {},
  '@leafer/interface': {},
  '@leafer/platform': {},
  '@leafer/event': {},
  '@leafer/data': {},
  '@leafer/partner': {},
  '@leafer/helper': {},
  '@leafer/list': {},
  '@leafer/web': {},
  '@leafer/decorator': {},
  '@leafer/layouter': {},
  '@leafer/file': {},
  '@leafer/display-module': {},
  '@leafer/canvas': {},
  '@leafer/layout': {},
  '@leafer/task': {},
  '@leafer/path': {},
  '@leafer/renderer': {},
};

export async function getLeaferVersion(): Promise<string> {
  console.log(bold(lightGreen('Fetching Leafer version...')));
  const defaultVersion = '1.0.3';
  const timeout = 10000; // 10 seconds

  const getNpmShowVersion = async (): Promise<string> => {
    try {
      return execSync('npm show leafer version').toString().trim();
    } catch {
      throw new Error('Failed to get version from npm.');
    }
  };

  const fetchVersionFromRegistry = async (registry: string): Promise<string> => {
    try {
      const response = await fetchWithTimeout(`${registry}leafer/latest`, timeout);
      if (!response.ok) {
        throw new Error(`Failed to fetch from ${registry}. Status: ${response.status}`);
      }
      const { version } = await response.json() as { version: string };
      return version;
    } catch {
      throw new Error(`Fetch from ${registry} failed`);
    }
  };

  try {
    const versionPromises = [
      getNpmShowVersion(),
      ...FallbackRegistries.map(fetchVersionFromRegistry),
    ];
    return await Promise.any(versionPromises);
  } catch {
    console.error(bold(lightYellow(`All Leafer version fetching methods failed. Using default version: ${defaultVersion}.`)));
    return defaultVersion;
  }
}

export async function findLeaferPackage(cwd: string): Promise<string[]> {
  const packagePath = path.resolve(cwd, 'package.json');
  if (!fs.existsSync(packagePath)) {
    return [];
  }

  const existing = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const allDependencies = [
    ...Object.keys(existing.devDependencies || {}),
    ...Object.keys(existing.dependencies || {}),
  ];

  return allDependencies.filter(item =>
    item in LeaferBasePackage || item in LeaferInPackage
  );
}

export function getLeaferPackageInfo() {
  return {
    ...LeaferBasePackage,
    ...LeaferInPackage,
    ...baseEditorInfo,
    ...baseInfo,
  };
}

export function getLeaferPackageName(): string[] {
  const allKeys = new Set<string>();
  const objects = [LeaferBasePackage, LeaferInPackage, baseEditorInfo, baseInfo];

  objects.forEach(obj => {
    Object.keys(obj).forEach(key => allKeys.add(key));
  });

  return Array.from(allKeys);
}

/**
 * @description Fetch with timeout
 * @param url Target URL
 * @param timeout Timeout in milliseconds
 * @returns Response
 */
async function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error
  }
}
