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

const CHAR = "char";
const COMM = "comm";
const CODE = "code";
const DEF = "def";
const NA = "na";

/**
 * Precompild Regex selectors for function tokens
 */
const REGEX = {
    // C type function declaration
    c_fn_decl: /[aA0-zZ9_\s]+\(.*\)/,
    c_struct_decl: /struct[\s]+/,
    c_enum_decl: /enum[\s]+/
}

/**
 * Utility log namespaced helper
 */
const log = logger('processor');

function container_from_type(type) {
    switch (type) {
    case COMM:
        return 'comments';

    case DEF:
        return 'defs';

    case CODE:
        return 'code';
    }
}

/**
 * Create new textual node representation
 *
 * @param start Number identifying starting line for this node.
 * @param ref_id Number identifying associate reference id.
 *
 * @return {Object} function node
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
 * Creates an empty State object
 * @return {object} Fresh state
 */
function create_state() {
    return {
        // Scope presence tracking struct
        inside: { comm: false, code: false, def: false },

        prev_comm_ptr: null,
        prev_code_ptr: null,
        prev_def_ptr: null,

        curr_comm_ptr: null,
        curr_code_ptr: null,
        curr_def_ptr: null,

        // Scope depth tracking
        depth: 0,
        line: 0,

        // Runtime config
        config: {
            [COMM]: { ref: CODE, container: 'comments' },
            [CODE]: { ref: COMM, container: 'code' },
            [DEF]: { ref: COMM, container: 'defs' }
        }
    };
}

/**
* Creates an AST structure with internal book keeping methods
* @return {object} Empty AST definition
*/
function create_ast_struct() {
    const ast = {
        source: [],
        comments: [],
        code: [],
        defs: [],
        index: []
    }

    const presence = function(src) {
        let accumulator = [];
        for (let i = 0; i < src.length; i++) {
            let c = src[i];
            if (c) { accumulator.push(c) };
        }
        return accumulator;
    }

    ast.code.present = () => (presence(ast.code))
    ast.defs.present = () => (presence(ast.defs))
    ast.comments.present = () => (presence(ast.comments))

    return ast;
}

/**
 * Parses input file path and returns AST result.
 * @return {object}
 */
async function process_ast(ipath) {

    // Stream input into a sizable buffer to work with,
    // Consuming the stream line by line.
    const reader = readline.createInterface({
        input: fs.createReadStream(ipath),
        console: false
    });

    const ast = await gen_ast(reader);
    return ast;
}

/**
  * Generate an Abstract Syntax Tree from source buffer stream
  * @return {object} AST definition
  */
function gen_ast(buffer) {
    // Create an empty ast tree to start with
    const ast = create_ast_struct();

    // Setup state for code parsing
    const state = create_state();

    // Asyncronously process our buffer into an AST
    const compute = new Promise((resolve, reject)=>{

        // line stack
        const stack = [];

        buffer.on('line', (line) => {
            if (stack.length < 2) {
                stack.push(line);
            } else {
                // log("line data", line);
                // process_line(ast, state, line)
            }
            process_line(ast, state, line)
        });

        buffer.on('close', (fin) => {
            resolve(ast);
        });
    })

    return compute;
}

/**
 * Handle node insertions.
 * Updates given AST with optional node insertion and data push.
 *
 * @param ast   {object} Abstract Syntax Tree
 * @param state {object} Shared runtime state and config
 * @param line  {string} line being fed in this iteration.
 * @param type  {string} node type identifier, possible options: 'comm' or 'code'.
 */
function process_node(ast, state, line, type) {
    const ref_id = state[`prev_${state.config[type].ref}_ptr`];
    const index = state[`curr_${type}_ptr`];

    if (!index) {
        log.error(`Invalid index: ${line} // ${type}`);
    }

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
 * @param ast   {object} Abstract Syntax Tree
 * @param state {object} Shared runtime state and config
 * @param line  {string} line being fed in this iteration.
 */
function process_line(ast, state, line, next_line) {
    let closing_comment = false;
    let closing_code = false;
    let closing_def = false;

    const ln = line.trim();
    const inside = state.inside.code ||
          state.inside.comm ||
          state.inside.def;

    const inside_def = state.inside.def;

    const prev_index = ast.index[state.line - 1];
    const prev_line = prev_index && ast[container_from_type(prev_index.type)];

    if (ln.indexOf('#') == 0 || ln == '') {
        ast.index[state.line] = { type: NA }
        ast.source[state.line] = line;
        state.line++;
        return;
    }

    // Detect tokens
    if (!inside && ln.indexOf("/**") >= 0) {
        state.inside.comm = true;
        state.curr_comm_ptr = state.line;
    }

    else if (ln.indexOf("*/") >= 0) {
        state.inside.comm = false;
        closing_comment = true;
    }

    // Possible branching outside of block comment variant.
    else if (!state.inside.comm) {

        if (!state.inside.code  && ln.indexOf("//") == 0) {
            closing_comment = true;
            state.curr_comm_ptr = state.line;
        }

        else if (!inside_def &&
                 (ln.match(REGEX.c_struct_decl) ||
                  ln.match(REGEX.c_enum_decl))) {
            state.inside.def = true;
            state.curr_def_ptr = state.line;

            // Bump code depth automatically depending on brace style
            if (ln.indexOf("{") >= 0) {
                state.depth = 1;
            }
        }

        else if (ln.match(REGEX.c_fn_decl)) {
            state.curr_code_ptr = state.line;

            // Handle one line declarations
            if (ln.indexOf(';') >= 0) {
                // log.hi("closing code: " + ln);
                closing_code = true;
            } else {
                state.inside.code = true;
            }

            // Bump code depth automatically depending on brace style
            if (ln.indexOf("{") >= 0) {
                state.depth = 1;
            }
        } else if (!inside) {
            // log(state.line + 1, ln);
            ast.index[state.line] = { node_id: state.line, type: CHAR }
            ast.source[state.line] = line;
            state.line++;
            return;
        }
    }

    // Detect closing scope depths
    const scope_open = (ln.match(/{/g) || []).length;
    const scope_close = (ln.match(/}/g) || []).length;
    const scope_delta =  (scope_close - scope_open) - state.depth;

    if (state.inside.code || state.inside.def) {
        // Close the scope if ; or } is present for struct / func respectively
        if (scope_delta == 0) {
            state.depth = 0;

            // Handle definition before code points for nesting realization
            if (state.inside.def) {
                if (ln.indexOf(';') >= 1) {
                    log.error("closing def");
                    state.inside.def = false;
                    closing_def = true;
                }
            }

            else if (state.inside.code && ln.indexOf('}') >= 0) {
                state.inside.code = false;
                closing_code = true;
            }

        } else if (scope_open > scope_close) {
            // Increasing scope depth
            state.depth++
        }
    }


    // Handle node insertions
    if (state.inside.comm || closing_comment) {
        process_node(ast, state, line, COMM);
    }

    else if (state.inside.code || closing_code) {
        if (prev_index.type == DEF || prev_index.type == CHAR) {

        }

        process_node(ast, state, line, CODE);
    }

    else if (state.inside.def || closing_def) {
        // log.error(`state.inside.def: ${state.inside.def}`)
        // log.error(`closing_def: ${closing_def}`)
        process_node(ast, state, line, 'def');
    }

    else {
        log.error("non-reachable: unknown state",
                  { no: state.line + 1, line});
    }

    // Scope cleanup
    if (closing_def) {
        state.prev_def_ptr = state.curr_def_ptr;
        state.curr_def_ptr = null;
    }

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
        log.error(`Invalid input file: ${input}`);
        return false;
    }

    const result = await process_ast(ipath);

    if (stdout) {
        // console.log("[doctor] processed: " + result);
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
