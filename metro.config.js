const { getDefaultConfig } = require('expo/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

const config = getDefaultConfig(__dirname);

// Exclude test files and docs from the app bundle to avoid executing top-level test code
config.resolver = config.resolver || {};
config.resolver.blockList = exclusionList([
  /(^|\\|\/)(test-[^\\\/]*\.js)$/, // any file starting with test-*.js
  /(^|\\|\/)__tests__(\\|\/).*/,    // __tests__ directories
  /(^|\\|\/)tests(\\|\/).*/,        // tests directories
  /(^|\\|\/)FINAL_.*\.md$/,          // final docs
  /(^|\\|\/)TODO.*\.md$/,            // todo docs
  /(^|\\|\/)DAILY_RESET_.*\.md$/,    // daily reset docs
]);

module.exports = config;
