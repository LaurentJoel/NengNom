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
// With two conflicting versions, pnpm does NOT hoist react to root node_modules —
// each workspace package gets its own copy. React@19 lives in
// packages/mobile/node_modules/react (junction → .pnpm/react@19.0.0/...).
// resolveRequest intercepts EVERY require('react') in the bundle and pins it
// to the mobile package's react@19 copy, preventing Metro from picking up
// the react@18 copy from packages/web when scanning watchFolders.
const reactRoot = path.resolve(projectRoot, 'node_modules');
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
