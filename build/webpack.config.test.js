/* eslint camelcase: off */
const webpack = require('webpack')
const config = require('../config')
const debug = require('debug')('app:webpack:config')

const paths = config.utils_paths;
const {__DEV__, __PROD__, __TEST__} = config.globals;

// -------------------------------------------------------------------
// Entry Points
// -------------------------------------------------------------------
const APP_ENTRY_PATHS = [
  'babel-polyfill',
  paths.client('transform.js'),
];

const appModulePaths = [
  // paths.client(),
  config.app_root,
  `${config.app_root}/config`,
  `${config.app_root}/tests`,
  `${config.app_root}/server`,
  `${config.app_root}/src`,
  `${config.app_root}/node_modules`,
];

debug('appModulePaths', appModulePaths[0]);

// -------------------------------------------------------------------
// Webpack Configuration module
// -------------------------------------------------------------------
const webpackConfig = {
  name: 'nuklear-sphinx-config',
  target: 'web',
  module: { rules: [] },

  resolve: {
    modules: appModulePaths,
    extensions: ['.js', '.jsx', '.json'],
  },
};


module.exports = webpackConfig;
