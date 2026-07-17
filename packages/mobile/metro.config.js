const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// packages/web uses react@18.2.0 while packages/mobile uses react@19.0.0.
// pnpm hoisted mode installs both; Metro (watching the whole monorepo) can
// pick up the 18.x copy for navigation packages, causing two React instances
// and "Cannot read property 'useMemo' of null" at runtime.
//
// resolveRequest intercepts EVERY require('react') in the bundle — unlike
// extraNodeModules which is only a fallback — and forces the single hoisted
// react@19.0.0 copy regardless of where in the tree the import originated.
const reactRoot = path.resolve(workspaceRoot, 'node_modules');
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react') {
    return { type: 'sourceFile', filePath: path.join(reactRoot, 'react', 'index.js') };
  }
  if (moduleName === 'react/jsx-runtime') {
    return { type: 'sourceFile', filePath: path.join(reactRoot, 'react', 'jsx-runtime.js') };
  }
  if (moduleName === 'react/jsx-dev-runtime') {
    return { type: 'sourceFile', filePath: path.join(reactRoot, 'react', 'jsx-dev-runtime.js') };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
