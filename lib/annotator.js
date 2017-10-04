/**
 * @fileOverview
 * Orchestrates the processing of an input file.
 * From AST generation to final String product.
 *
 * @name annotator.js
 * @author Bailey Cosier <bailey@cosier.ca>
 * @license MIT
 */

const fs = require('fs');
const exists = fs.existsSync;

const readline = require('readline');
const resolve = require('path');

const logger = require('./utils').logger;
const C = require('./constants');

/**
 * Utility log namespaced helper
 */
const log = logger('annotator');

/**
 * Annotates a given file with node types
 * @param {string} file 
 */
function annotate_file(file) {
    log(`annotating file: ${file}`)
}

module.exports = {
    annotate_file
}