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

const node = require('./node');
const utils = require('./utils');
const colorize = utils.colorize;
const logger = utils.logger;
const C = require('./constants');
const ast_from_file = require('./abstractor').ast_from_file;
const proc = require('process');

/**
 * Utility log namespaced helper
 */
const log = logger('annotator');
const options = {};
let dyn_width = 0;
let dyn_thres = 0;

const colors = {
    comments: 'blue',
    code:     'cyan',
    chars:    'grey',
    def:      'yellow',
    members:  'green',
}

function padding(data) {
    let pad;
    const width = 120;
    const max = width > dyn_width ? width : dyn_width;
    const min = 120;
    const len = data.length;

    if (len <= 80 && dyn_thres > 0) {
        dyn_thres = dyn_thres - 1;
    }

    if (len <= min && dyn_thres == 0) {
        pad = min - len;

        if (dyn_thres <= 0 && dyn_width > 0) {
            dyn_width = 0;
            dyn_thres = 0;
        }

    } else if (dyn_width >= len){
        pad = dyn_width - len;

    } else {
        dyn_width = len + 1;
        pad = 1;
    }

    if (pad + len > max) {
        pad = max - len
    } else if (pad + len < max && dyn_thres == 0) {
        pad = max - len;
    }

    if (pad <= 0) { pad = 1;}

    return ' '.repeat(pad);
}

function annotate_line(ast, n, i) {
    if (options.range) {
        let int = parseInt(i);
        if (int < options.start || int > options.end) {
            return;
        }
    }

    // Ignore subline entries
    if (i.indexOf('.') >= 0) {
        return;
    }

    let data = n.data[i];

    if (data == undefined) {
        let index = n.index[i];
        if (!index) {
            console.error(n, i, ast.index[i])
            process.exit();
        }
        n = n.inner[n.index[i].ind];
        data = n.data[i];
    }

    if (data == undefined) {
        console.error(n, data, i);
        process.exit();
    }

    const attrs = {};
    Object.assign(attrs, n.assocs);

    const info = JSON.stringify(attrs);
    const annot = `${padding(data)}// ${i}.${n.type} @${n.id},${info}`;
    const line = data + annot;

    if (options.colorize) {
        let clr = colors[n.type];
        colorize(clr, line);
    } else {
        console.log(line);
    }
}

function parse_range(range) {
    if (range) {
        options.range = range;
        if (typeof range == 'string' && range.indexOf(',') >= 0) {
            options.start = parseInt((range.split && range.split(',')[0]) || range);
            options.end = parseInt(range.split && range.split(',')[1] || start + 5);
        } else {
            range = parseInt(range);
            options.start = range;
            options.end = range;
        }

        if (options.end < options.start) {
            const msg = `Range End(${options.end}) < Start(${options.start})`;
            log.error(msg);
            proc.exit(1);
        }
    }
}

/**
 * Annotates a given file with node types
 * @param {string} file
 */
async function annotate_file(file, opts = {}) {
    log(`annotating file: ${file}`)
    const ast = await ast_from_file(file);
    parse_range(opts.range);

    if (opts.colorize) {
        options.colorize = true;
    }

    for (i in ast.index) {
        let n;
        let container;
        const lookup = ast.index[i];

        if (lookup.parent) {
            n = node.root(ast, lookup.parent);
        } else {
            container = ast[lookup.type];
            n = container[lookup.node_id];
        }

        annotate_line(ast, n, i)
    }

}

module.exports = {
    annotate_file
}
