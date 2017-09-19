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

if (__DEV__) {
  webpackConfig.devtool = config.compiler_devtool;
}

webpackConfig.entry = {
  app: APP_ENTRY_PATHS,
};

webpackConfig.node = {
  child_process: 'empty',
  'strip-bom': 'empty',
  browser: 'empty',
  net: 'empty',
  tls: 'empty',
  fs: 'empty',
};

// -------------------------------------------------------------------
// Bundle Output
// -------------------------------------------------------------------
webpackConfig.output = {
  filename: `[name].[${config.compiler_hash_type}].js`,
  path: paths.dist(),
  publicPath: config.compiler_public_path,
};

// -------------------------------------------------------------------
// Plugins
// -------------------------------------------------------------------
webpackConfig.plugins = [
    new webpack.IgnorePlugin(/jsdom$/),
    new webpack.DefinePlugin(config.globals),
    new webpack.ProvidePlugin({
        '_': 'lodash',
    }),
    new webpack.DefinePlugin({
        'process.env': {
            'NODE_ENV': JSON.stringify('production')
        }
    }),
];

if (__PROD__) {
  debug('Enable plugins for production (OccurenceOrder, Dedupe & UglifyJS).');
  webpackConfig.plugins.push(
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      compress: {
        unused: true,
        dead_code: true,
        warnings: false,
      },
    })
  );
}

// Don't split bundles during testing, since we only want import one bundle
if (!__TEST__) {
  webpackConfig.plugins.push(
    new webpack.optimize.CommonsChunkPlugin({
      names: ['vendor'],
    })
  );
}

// -------------------------------------------------------------------
// Webpack Rules
// -------------------------------------------------------------------
// JavaScript / JSON
webpackConfig.module.rules = [{
  test: /\.(js|jsx)$/,
  exclude: /node_modules/,
  loader: 'babel-loader',
  query: {
    cacheDirectory: true,
    plugins: [
      'transform-decorators-legacy',
      'transform-runtime',
      'transform-es3-property-literals',
      'transform-es3-member-expression-literals',
    ],
    presets: ['es2015', 'stage-0'],
    env: {
      production: {
        presets: ['react-optimize'],
      },

      "development": {
        "plugins": []
      }

    },
  },
},
];


module.exports = webpackConfig;
