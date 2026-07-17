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

// Force a single React instance across the monorepo.
// With pnpm hoisted mode, multiple copies of React can get bundled
// (one from root node_modules, one from a nested transitive dep),
// causing "Cannot read property 'useMemo' of null" at runtime.
config.resolver.extraNodeModules = {
  react: path.resolve(workspaceRoot, 'node_modules/react'),
  'react-native': path.resolve(workspaceRoot, 'node_modules/react-native'),
  'react-native/Libraries/Utilities/PolyfillFunctions': path.resolve(
    workspaceRoot,
    'node_modules/react-native/Libraries/Utilities/PolyfillFunctions',
  ),
};

module.exports = config;
