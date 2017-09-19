/* eslint key-spacing:0, spaced-comment:0, camelcase:0 */

const path = require('path')
const debug = require('debug')('app:config')
const argv = require('yargs').argv

// const server_host = process.env.SERVER_HOST || ip.address();
const env = process.env.APP_ENV || 'development';
let devtool = 'source-map';

if (env == 'development') {
  /* devtool = 'eval';*/
  /* devtool = 'source-map';*/
  /* devtool = 'cheap-module-eval-source-map';*/
}

// ========================================================
// Default Configuration
// ========================================================
const config = {
  env,
  // ----------------------------------
  // Project Structure
  // ----------------------------------
  app_root   : path.resolve(__dirname, '..'),
  dir_public : 'public',
  dir_client : 'src',
  dir_dist   : 'dist',
  dir_server : 'server',
  dir_test   : 'tests',

  // ----------------------------------
  // Compiler Configuration
  // ----------------------------------
  compiler_css_modules     : false,
  compiler_babel : {
    cacheDirectory : true,
    // plugins        : ['transform-runtime', 'transform-decorators-legacy'],
    // presets        : ['es2015', 'react', 'stage-0']
  },
  compiler_devtool         : devtool,
  compiler_hash_type       : 'hash',
  compiler_fail_on_warning : false,
  compiler_quiet           : false,
  compiler_public_path     : '/',
  compiler_stats           : {
    chunks : false,
    chunkModules : false,
    colors : true,
  },

  compiler_vendor : [],

  // ----------------------------------
  // Test Configuration
  // ----------------------------------
  coverage_reporters : [
    {type : 'text-summary'},
    {type : 'lcov', dir : 'coverage'},
  ],
};

/************************************************
-------------------------------------------------

All Internal Configuration Below
Edit at Your Own Risk

-------------------------------------------------
************************************************/

// ------------------------------------
// Environment
// ------------------------------------
// N.B.: globals added here must _also_ be added to .eslintrc
config.globals = {
  'process.env'  : {
    'NODE_ENV' : JSON.stringify(config.env),
  },
  'NODE_ENV'     : config.env,
  '__DEV__'      : config.env === 'development',
  '__PROD__'     : config.env === 'production',
  '__TEST__'     : config.env === 'test',
  '__DEBUG__'    : config.env === 'development' && !argv.no_debug,
  '__COVERAGE__' : !argv.autoWatch && config.env === 'test',
  '__BASENAME__' : JSON.stringify(process.env.BASENAME || ''),
  '__API_ENDPOINT__' : JSON.stringify(process.env.API_ENDPOINT),
  '__API_PROTOCOL__' : JSON.stringify(process.env.API_PROTOCOL)
};

// debug('API_ENDPOINT', process.env.API_ENDPOINT);
// debug('API_PROTOCOL', process.env.API_PROTOCOL);

// ------------------------------------
// Validate Vendor Dependencies
// ------------------------------------
const pkg = require('../package.json');

config.compiler_vendor = config.compiler_vendor
  .filter((dep) => {
    if (pkg.dependencies[dep]) return true;

    debug(
      `Package "${dep}" was not found as an npm dependency in package.json; ` +
      `it won't be included in the webpack vendor bundle.
       Consider removing it from vendor_dependencies in ~/config/index.js`
    );
  });

// ------------------------------------
// Utilities
// ------------------------------------
const resolve = path.resolve;
const base = (...args) =>
  Reflect.apply(resolve, null, [config.app_root, ...args]);

config.utils_paths = {
  base,
  client : base.bind(null, config.dir_client),
  dist   : base.bind(null, config.dir_dist),
  public : base.bind(null, config.dir_public),
};

module.exports = config

