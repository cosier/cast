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
const ast_from_file = require('./abstractor').ast_from_file;

/**
 * Utility log namespaced helper
 */
const log = logger('annotator');

const options = {};

function root_node(ast, id) {
    const lookup = ast.index[id];
    if (lookup.parent) {
        return root_node(ast, lookup.parent);
    } else {
        const node = ast[lookup.type][lookup.node_id];
        return node;
    }

}

function annotate_line(ast, node, i) {
    i = parseInt(i);

    if (options.range) {
        if (i < parseInt(options.start) || i > parseInt(options.end)) {
            return;
        }
    }

    console.log(node);
}

/**
 * Annotates a given file with node types
 * @param {string} file
 */
async function annotate_file(file, range) {
    log(`annotating file: ${file}`)
    const ast = await ast_from_file(file);

    if (range) {
        options.range = range;
        options.start = (range.split && range.split(',')[0]) || range;
        options.end = range.split && range.split(',')[1] || start + 5;
    }

    for (i in ast.index) {
        let node;
        let container;
        const lookup = ast.index[i];

        if (lookup.parent) {
            node = root_node(ast, lookup.parent);
        } else {
            container = ast[lookup.type];
            node = container[lookup.node_id];
        }

        annotate_line(ast, node, i)
    }

}

module.exports = {
    annotate_file
}
