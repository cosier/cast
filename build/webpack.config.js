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
    // 'babel-polyfill',
    paths.client('index.js'),
];

const appModulePaths = [
    // paths.client(),
    config.app_root,
    `${config.app_root}/node_modules`,
    `${config.app_root}/config`,
    `${config.app_root}/tests`,
    `${config.app_root}/src`,
];

// -------------------------------------------------------------------
// Webpack Configuration module
// -------------------------------------------------------------------
const webpackConfig = {
    name: 'nuklear-doctor-config',
    target: 'node',
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
    index: APP_ENTRY_PATHS,
};

// -------------------------------------------------------------------
// Bundle Output
// -------------------------------------------------------------------
webpackConfig.output = {
    filename: `[name].js`,
    path: paths.dist(),
    publicPath: config.compiler_public_path,
    libraryTarget: 'commonjs'
};

webpackConfig.externals = [ /^(?!\.|\/).+/i, ]


// -------------------------------------------------------------------
// Webpack Rules
// -------------------------------------------------------------------
// JavaScript / JSON
// webpackConfig.module.rules = [{
// test: /\.(js|jsx)$/,
// exclude: /node_modules/,
// loader: 'babel-loader',
// query: {
// cacheDirectory: true,
// plugins: [
// 'transform-runtime',
// 'transform-decorators-legacy',
// 'transform-es3-property-literals',
// 'transform-es3-member-expression-literals',
// ],
// presets: ['es2015', 'stage-0'],
// env: {
// production: {
// // presets: ['react-optimize'],
// },

// "development": {
// "plugins": []
// }

// },
// },
// },
// ];


module.exports = webpackConfig;
