const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Add fallbacks for Node.js modules that aren't available in the browser
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "assert": require.resolve("assert"),
    "http": require.resolve("stream-http"),
    "https": require.resolve("https-browserify"),
    "os": require.resolve("os-browserify"),
    "url": require.resolve("url"),
    "util": require.resolve("util"),
  };
  
  // Ensure proper module resolution
  config.resolve.modules = [
    'node_modules',
    './node_modules',
    '../node_modules'
  ];
  
  return config;
};