import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { bold, lightGreen, lightYellow } from 'kolorist';
import { getNpmRegistry } from './getUserInfo';

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
      '@leafer-in/text-editor',
      '@leafer-in/viewport',
      '@leafer-in/view',
      '@leafer-in/scroll',
      '@leafer-in/arrow',
      '@leafer-in/html',
      '@leafer-in/find',
      '@leafer-in/export',
    ],
  },
  '@leafer-editor/worker': { type: 'save' },
  '@leafer-editor/node': { type: 'save' },
  '@leafer-editor/miniapp': { type: 'save' },
  'leafer-draw': { type: 'save' },
  '@leafer-draw/worker': { type: 'save' },
  '@leafer-draw/node': { type: 'save' },
  '@leafer-draw/miniapp': { type: 'save' },
  'leafer-game': { type: 'save' },
  '@leafer-game/worker': { type: 'save' },
  '@leafer-game/node': { type: 'save' },
  '@leafer-game/miniapp': { type: 'save' },
  'leafer': { type: 'save' },
  '@leafer/worker': { type: 'save' },
  '@leafer/node': { type: 'save' },
  '@leafer/miniapp': { type: 'save' },
  '@leafer-in/viewport': { type: 'save' },
  '@leafer-in/view': { type: 'save' },
  '@leafer-in/scroll': { type: 'save' },
  '@leafer-in/arrow': { type: 'save' },
  '@leafer-in/html': { type: 'save' },
  '@leafer-in/text-editor': { type: 'save' },
  '@leafer-in/motion-path': { type: 'save' },
  '@leafer-in/robot': { type: 'save' },
  '@leafer-in/state': { type: 'save' },
  '@leafer-in/find': { type: 'save' },
  '@leafer-in/export': { type: 'save' },
  '@leafer-in/filter': { type: 'save' },
  '@leafer-in/color': { type: 'save' },
  '@leafer-in/animate': { type: 'save' },
  '@leafer-in/resize': { type: 'save' },
  '@leafer-in/flow': { type: 'save' },
  '@leafer-in/editor': { type: 'save' },
  '@leafer-in/bright': { type: 'save' },
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
  const defaultVersion = '2.0.0';
  const timeout = 10000; // 10 seconds
  const usePromiseAny = typeof Promise.any === 'function';

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
    const registries = getRegistryList();

    if (usePromiseAny) {
      try {
        return await getNpmShowVersion();
      } catch {
        // Fallback to registry fetch
      }
      return await Promise.any(registries.map(fetchVersionFromRegistry));
    }

    try {
      return await getNpmShowVersion();
    } catch {
      // Fallback to registry fetch
    }

    for (const registry of registries) {
      try {
        return await fetchVersionFromRegistry(registry);
      } catch {
        // Continue to next registry
      }
    }

    throw new Error('All Leafer version fetching methods failed.');
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
    const fetchFn = await getFetch();
    const response = await fetchFn(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error
  }
}

function normalizeRegistry(registry: string) {
  if (!registry) return '';
  return registry.endsWith('/') ? registry : `${registry}/`;
}

function getRegistryList() {
  const registry = normalizeRegistry(getNpmRegistry());
  const registries = [
    registry,
    ...FallbackRegistries.map(normalizeRegistry),
  ].filter(Boolean);
  return Array.from(new Set(registries));
}

async function getFetch(): Promise<typeof fetch> {
  if (typeof fetch === 'function') {
    return fetch;
  }
  const { default: fetchFn } = await import('node-fetch');
  return fetchFn as unknown as typeof fetch;
}
