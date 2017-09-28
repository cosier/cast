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
const COMM = "comments";
const CODE = "code";
const MEMB = "member";
const DEF = "defs";
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
 * Panic flag.
 * If triggered - process will cease processing data.
 */
let PANIC = false;

/**
 * Utility log namespaced helper
 */
const log = logger('processor');

/**
 * Convert node type to container definition string
 */
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
 * Create new textual node representation for the AST.
 *
 * @param id {number} identifying starting line for this node.
 * @param assoc_type {string} identifying associate reference type.
 * @param assoc_id {number} identifying associate reference id.
 *
 * @return {object} AST Node
 */
function create_node(id, {node_type, assoc_type, assoc_id}) {
  // Prepare initial association references
  let assoc_container = {_id: id, _type: node_type};

  if (assoc_id) {
    assoc_container[assoc_type] = [assoc_id]
  }

  return {
    id: id,
    type: node_type,
    assocs: assoc_container,
    data: []
  };
}

/**
 * Creates an empty State object
 * @return {object} Fresh state
 */
function create_state() {
  return {
    // Scope presence tracking struct
    inside: { comm: false, code: false, def: false },

    current: {},
    previous: {},

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

  ast.node = (id) => {
    const container = container_from_type(ast.index[id].type);
    return ast[container][id];
  }

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
      if (PANIC) { return; }

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
 *
 * @return node {object} AST Node
 */
function process_node(ast, state, line, type) {
  const ref_type = state.config[type].ref;
  const ref_id = state.previous[ref_type];
  const index = state.current[type];

  if (!index && index != 0) {
    log.error(`Invalid index(${type}): ${line} // ${type}`);
  }

  const container = state.config[type].container;
  let node = ast[container][index];

  if (!node) {
    node = create_node(index, {
      node_type: type,
      assoc_type: ref_type,
      assoc_id: ref_id
    });

    ast[container][index] = node;
  }

  // Manage an index for lookback searching
  ast.index[state.line] = { node_id: index, type: type }

  node.data.push(line);
  return node;
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

  // Detect closing scope depths
  const scope_open = (ln.match(/{/g) || []).length;
  const scope_close = (ln.match(/}/g) || []).length;
  const scope_delta =  (scope_close - scope_open) - state.depth;

  let block_start = false;

  const inside_def = state.inside.def;

  const prev_index = ast.index[state.line - 1];
  const prev_line = prev_index && ast.source[state.line - 1];

  if (ln.indexOf('#') == 0 || ln == '') {
    ast.index[state.line] = { type: NA }
    ast.source[state.line] = line;
    state.line++;
    return;
  }

  // Detect tokens
  if (!inside && ln.indexOf("/**") >= 0) {
    state.inside.comm = true;
    state.current[COMM] = state.line;
    block_start = true;
  }

  else if (ln.indexOf("*/") >= 0) {
    state.inside.comm = false;
    closing_comment = true;
  }

  // Possible branching outside of block comment variant.
  else if (!state.inside.comm) {

    if (!state.inside.code  && ln.indexOf("//") == 0) {
      closing_comment = true;
      state.current[COMM] = state.line;
      block_start = true;
    }

    else if (!inside_def &&
             (ln.match(REGEX.c_struct_decl) ||
              ln.match(REGEX.c_enum_decl))) {
      state.inside.def = true;
      state.current[DEF] = state.line;
      block_start = true;

      // Bump code depth automatically depending on brace style
      if (ln.indexOf("{") >= 0) {
        state.depth = 1;
      }
    }

    else if (ln.match(REGEX.c_fn_decl)) {
      state.current[CODE] = state.line;

      // Handle one line declarations
      if (ln.indexOf(';') >= 0) {
        closing_code = true;
      } else {
        state.inside.code = true;
        block_start = true;
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

  let node;

  // Handle node insertions
  if (state.inside.comm || closing_comment) {
    node = process_node(ast, state, line, COMM);
  }

  else if (state.inside.code || closing_code) {
    node = process_node(ast, state, line, CODE);

    if (prev_index && prev_index.type == DEF || prev_index.type == CHAR) {
      transform_node(ast, prev_index.node_id, prev_index.type, CODE);
      combine_nodes(ast, ast.code[prev_index.node_id], ast.code[state.line]);
      state.previous[CODE] = null;
      state.current[CODE] = prev_index.node_id;
    }
  }

  else if (state.inside.def || closing_def) {
    node = process_node(ast, state, line, DEF);
  }

  else {
    log.error("non-reachable: unknown state",
              { no: state.line + 1, line});
  }

  // Create associations
  if (block_start || state.inside[DEF]) {
    log.pink(ln + " // " + node.type);

    let related = find_common_precedence(ast, state, node);
    if (related) {
      associate_nodes(ast, node, related);
    }
  }

  // Scope cleanup
  if (closing_def) {
    state.previous[DEF] = state.current[DEF];
    state.current[DEF] = null;
  }

  if (closing_code) {
    state.previous[CODE] = state.current[CODE];
    state.current[CODE] = null;
  }

  if (closing_comment) {
    state.previous[COMM] = state.current[COMM];
    state.current[COMM] = null;
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
 * Transform a node between various node nodes in the tree.
 *
 * @param ast {object} AST object tree
 * @param index {number} Index into AST for the target node
 * @param from {string} Type of node we are transforming
 * @param dst {string} Destination Type for the Node
 *
 * @return {void}
 */
function transform_node(ast, index, from, dst) {
  const from_container = container_from_type(from);
  const dest_container = container_from_type(dst);

  const node = ast[dest_container][index] = ast[from_container][index];
  delete ast[from_container][index];

  ast.index[index].type = dst;
  node.type = dst;
}

/**
 * Combine two adjacent nodes in the tree
 *
 * @param ast {object} AST Tree
 * @param n1 {object} Node 1
 * @param n2 {object} Node 2
 *
 * @return {void}
 */
function combine_nodes(ast, no1, no2) {
  const range = no1.id - no2.id;
  let n1, n2;

  if (range != -1 && range != 1) {
    log.error(`Invalid Node Range: ${range}`)
    log.error(`Nodes must be adjacent to each other`)
    PANIC = true;
  }

  if (no1.id < no2.id) {
    n1 = no1;
    n2 = no2;
  } else {
    n1 = no2;
    n2 = no1;
  }

  // Update index shift to adjacent id
  const segment = n2.data.length;

  for (let i = n2.id; i < (n2.id + segment); i++) {
    ast.index[i].node_id = n1.id;
  }

  let pop;
  while (pop = n2.data.pop()) {
    n1.data.push(pop);
  }

  const container = container_from_type(n2.type);
  if (ast[container][n2.id]) {
    let existing = ast[container][n2.id];
    ast[container][n2.id] = null;
  } else {
    log.error(`Could not find node inside [${n2.node_type}]`)
  }
}

/**
 * Finds related nodes preceding the target node for association.
 *
 * @param ast {object} AST Tree to operate on
 * @param state {object} Parser State
 * @param node {object} AST Node object
 *
 * @return match {object} Matched AST node
 */
function find_common_precedence(ast, state, node) {
  let match, container;
  if (node.type == CODE || node.type == CHAR || node.type == DEF) {
    let prev_comm_id = ast.index[node.id - 1].node_id
    let lookup = ast.index[prev_comm_id];

    if (lookup && lookup.type == COMM) {
      container = container_from_type(lookup.type)
      match = ast[container][lookup.node_id];
    }
  }

  return match
}

/**
* Link two nodes together via recipricol association.
*
* @param ast {object} AST Tree to operate on
* @param node {object} AST Node object
* @param related {object} AST Node object
*
* @return {void}
*/
function associate_nodes(ast, node, related) {
  const ntype = container_from_type(related.type);
  const rtype = container_from_type(node.type);

  if (!node.assocs[ntype]) node.assocs[ntype] = [];
  if (!related.assocs[rtype]) related.assocs[rtype] = [];

  const rcontains = related.assocs[rtype].indexOf(node.id);
  const ncontains = node.assocs[ntype].indexOf(related.id);

  if (rcontains < 0) {
    related.assocs[rtype].push(node.id);
  }

  if (ncontains < 0) {
    node.assocs[ntype].push(related.id)
  }

  // related.assocs.defs = [];
}

/**
 *  Transforms input into AST redirected to stdout.
 *
 * @return {boolean} operation success flag
 **/
async function doctor(input) {
  let opath = null;
  let stdout = false;
  let success = false;

  const ipath = resolve(input);

  if (!exists(ipath)) {
    log.error(`Invalid input file: ${input}`);
    return false;
  }

  const result = await process_ast(ipath);
  return success;
}

/**
 * Expose doctor interface
 */
export {doctor, gen_ast}
