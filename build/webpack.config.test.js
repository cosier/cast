/* eslint camelcase: off */
const webpack = require('webpack')
const config = require('../config')
const debug = require('debug')('app:webpack:config')

const paths = config.utils_paths;
const {__DEV__, __PROD__, __TEST__} = config.globals;

const appModulePaths = [
];

// -------------------------------------------------------------------
// Webpack Configuration module
// -------------------------------------------------------------------
const webpackConfig = {
  name: 'nuklear-doctor-config',
  target: 'node',
  module: { rules: [] },

  // externals: [ /^(?!\.|\/).+/g ],

  resolve: {
    extensions: ['.js', '.json'],
    modules: [
      `${config.app_root}/node_modules`,
    ],
  },
};




module.exports = webpackConfig;
