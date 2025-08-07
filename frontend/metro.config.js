const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable SVG support
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts.push('svg');

// Web-specific module resolution fixes
config.resolver.platforms = ['web', 'ios', 'android', 'native'];

// Use only local node_modules to avoid workspace resolution conflicts
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
];

config.resolver.alias = {
  ...config.resolver.alias,
  'react-native$': 'react-native-web',
};

// Disable dependency optimization that causes Supabase issues
config.resolver.dependencyExtractor = undefined;
config.resolver.useWatchman = false;

module.exports = config;