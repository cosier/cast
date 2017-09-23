/**
 * @fileOverview
 * Orchestrates the processing of an input file.
 * From AST generation to final String product.
 *
 * @name processor.js
 * @author Bailey Cosier <bailey@cosier.ca>
 * @license MIT
 */

import fs, {writeFileSync as write, existsSync as exists} from 'fs';
import readline from 'readline';
import {logger} from './utils';
import {resolve} from 'path';

/**
 * Precompild Regex selectors for function tokens
 */
const REGEX = {
    // C type function declaration
    c_fn_decl: /[aA0-zZ9_\s]+\(.*\)/,
    c_struct_decl: /struct[\s]+/,
    c_enum_decl: /enum[\s]+/,
}

/**
 * Utility log namespaced helper
 */
const log = logger('processor');

/**
 * Create new textual node representation
 *
 * @param start Number identifying starting line for this node.
 * @param ref_id Number identifying associate reference id.
 *
 * @return Object function node
 */
function create_node(start, ref_id) {
    let entry = {
        ref_id: ref_id,
        start: start,
        end: null,
        data: []
    };
    return entry;
}

/**
 * Handle node insertions.
 * Updates given AST with optional node insertion and data push.
 *
 * @param ast   Object Abstract Syntax Tree
 * @param state Object Shared runtime state and config
 * @param line  String line being fed in this iteration.
 * @param type  String node type identifier, possible options: 'comm' or 'code'.
 */
function process_node(ast, state, line, type) {
    const ref_id = state[`prev_${state.config[type].ref}_ptr`];
    const index = state[`curr_${type}_ptr`];

    const container = state.config[type].container;
    let node = ast[container][index];

    if (!node) {
        node = create_node(index, ref_id);
        ast[container][index] = node;
    }

    // Manage an index for lookback searching
    ast.index[state.line] = { node_id: index, type: type }

    node.data.push(line);
}

/**
 * Process individual lines fed by the buffer stream.
 *
 * @param ast   Object Abstract Syntax Tree
 * @param state Object Shared runtime state and config
 * @param line  String line being fed in this iteration.
 */
function process_line(ast, state, line) {
    let closing_comment = false;
    let closing_code = false;
    let ln = line.trim();

    if (ln.indexOf('#') == 0 || ln == '') {
        ast.index[state.line] = { type: 'na' }
        state.line++;
        return;
    }


    // Detect tokens
    if (ln.indexOf("/*") == 0) {
        state.inside.comm = true;
        state.curr_comm_ptr = state.line;
    }

    else if (ln.indexOf("*/") >= 0) {
        state.inside.comm = false;
        closing_comment = true;
    }

    // Possible branching outside of block comment.
    else if (!state.inside.comm && !state.inside.code) {

        if(ln.indexOf("//") == 0) {
            closing_comment = true;
            state.curr_comm_ptr = state.line;
        }

        else if (ln.match(REGEX.c_fn_decl) ||
                 ln.match(REGEX.c_struct_decl) ||
                 ln.match(REGEX.c_enum_decl)) {

            state.curr_code_ptr = state.line;

            // Handle one line declarations
            if (ln.indexOf(';') >= 0) {
                closing_code = true;
            } else {
                state.inside.code = true;
            }

            // Bump code depth automatically depending on brace style
            if (ln.indexOf("{") >= 0) {
                state.depth = 1;
            }
        } else {
            log(state.line + 1, ln);
        }
    }

    // Detect closing scope depths
    if (state.inside.code) {
        const open_count = (ln.match(/{/g) || []).length;
        const close_count = (ln.match(/}/g) || []).length;

        if ((close_count - open_count) - state.depth == 0) {
            // Close the scope
            state.inside.code = false;
            state.depth = 0;

            closing_code = true;

        } else if (open_count > close_count) {
            // Increasing scope depth
            state.depth++
        }
    }

    // Handle node insertions
    if (state.inside.comm || closing_comment) {
        process_node(ast, state, line, 'comm');
    }

    else if (state.inside.code || closing_code) {
        process_node(ast, state, line, 'code');
    }

    else {
        log.error("non-reachable: unknown state",
                  { no: state.line + 1, line});
    }

    // Scope cleanup
    if (closing_code) {
        state.prev_code_ptr = state.curr_code_ptr;
        state.curr_code_ptr = null;
    }

    if (closing_comment) {
        state.prev_comm_ptr = state.curr_comm_ptr;
        state.curr_comm_ptr = null;
    }

    // Record prestine data
    ast.source.push(line);

    state.line++;
}

/**
 * Parses input file path and returns string result.
 * @return String
 */
async function process_tree(ipath) {

    // Stream input into a sizable buffer to work with,
    // Consuming the stream line by line.
    const reader = readline.createInterface({
        input: fs.createReadStream(ipath),
        console: false
    });

    const ast = await gen_ast(reader);
    return `<process::success::${ast.source.length}>`;
}

/**
  * Generate an Abstract Syntax Tree from source buffer stream
  * @return object Returns the AST object
  */
function gen_ast(buffer) {
    const compute = new Promise((resolve, reject)=>{
        log("Async AST Generation");
        let ast = {
            source: [],
            comments: [],
            code: [],
            index: []
        }

        // Setup state pointers for code tracking
        let state = {
            // Scope presence tracking struct
            inside: { comm: false, code: false },

            prev_comm_ptr: null,
            prev_code_ptr: null,

            curr_code_ptr: null,
            curr_comm_ptr: null,

            // Scope depth tracking
            depth: 0,
            line: 0,

            // Runtime config
            config: {
                comm: { ref: 'code', container: 'comments' },
                code: { ref: 'comm', container: 'code' }
            }
        };

        buffer.on('line', (line) => {
            // log("line data", line);
            process_line(ast, state, line)
        });

        buffer.on('close', (fin) => {
            log(`processed ${ast.comments.length} comments`)
            log(`processed ${ast.code.length} code points`)
            resolve(ast);
        });

        buffer.on('end', () => {
            log('buffer.end');
            resolve(ast);
        });
    })

    return compute;
}

/**
 * Writes contents to a file
 * @return Boolean
 */
function printf(opath, contents) {
    try {
        write(opath, contents)
    } catch(e) {
        console.log("Failed to write file")
        return false;
    }

    log(`output -> ${opath}`)
    return true
}

/**
 *  Handles input into output.
 *  If output is not provided, stdout is used.
 *
 * @return Boolean
**/
async function doctor(input, output) {
    let opath = null;
    let stdout = false;
    let success = false;

    const ipath = resolve(input);

    if (output) {
        opath = resolve(output);
    } else {
        stdout = true;
    }

    if (!exists(ipath)) {
        console.error(`Invalid input file: ${input}`);
        return false;
    }

    const result = await process_tree(ipath);

    if (stdout) {
        console.log("[doctor] processed: " + result);
        success = true;
    } else if (result) {
        success = printf(opath, result)
    }

    return success;
}

/**
 * Expose doctor interface
 */
export {doctor, gen_ast}