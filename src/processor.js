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
 * Precompiled Regex selectors for function tokens
 */
const REGEX = {
  // C type function declaration
  c_fn_decl: /[aA0-zZ9_\s]+\(.*\)/,
  c_struct_decl: /struct[\s]+/,
  c_enum_decl: /enum[\s]+/
}

/**
 * Panic flag.
 * If triggered - promises will cease processing data.
 */
let PANIC = false;

/**
 * Utility log namespaced helper
 */
const log = logger('processor');

/**
 * Process individual lines fed by the buffer stream.
 *
 * @param ast   {object} Abstract Syntax Tree
 * @param state {object} Shared runtime state and config
 * @param line  {string} line being fed in this iteration.
 */
function process_line(ast, state, line) {
  // Clear per line specific state;
  state.node = null;
  state.closing = {};
  state.block_start = false;
  state.current_line = line;
  state.ln = line.trim();

  // Record prestine data
  ast.source.push(line);
  state.lno++;

  ///////////////////////////////////////////////
  // Ignore non-applicable lines
  if (state.ln.indexOf('#') == 0 || state.ln == '') {
    ast.index[state.lno] = { type: NA }
    return;
  }

  ///////////////////////////////////////////////
  // Detect tokens
  tokenizer(ast, state);

  ///////////////////////////////////////////////
  // Process scope depths
  scope_depths(ast, state);

  ///////////////////////////////////////////////
  // Handle node insertions
  insert_node(ast, state);

  ///////////////////////////////////////////////
  // Create associations
  create_association(ast, state);

  ///////////////////////////////////////////////
  // Scope iteration and cleanup
  scope_iterate(ast, state);
}

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

  return type;
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
 * Perform a cached lookup for an indexed Node.
 * If requested node is non-existent, it will be created.
 * @param ast {object} AST tree
 * @param index {number} ID Index for the node, typically line no.
 * @param container {string} container object.
 *
 * @return {object} AST Node
 */
function cached_node(ast, index, container, opts) {
  let node = ast[container][index];

  if (!node) {
    node = create_node(index, opts);
    ast[container][index] = node;
  }

  return node;
}

/**
 * Creates an empty State object
 * @return {object} Fresh state
 */
function create_state() {
  return {
    // Scope presence tracking structs
    inside: {},
    current: {},
    previous: {},

    // Scope depth tracking
    depth: 0,
    lno: -1,

    // Runtime config
    config: {
      [COMM]: { ref: CODE, container: COMM },
      [CODE]: { ref: COMM, container: CODE },
      [MEMB]: { ref: DEF, container: DEF },
      [DEF]:  { ref: COMM, container: DEF }
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
    comments: {},
    code: {},
    defs: {},
    members: {},
    index: []
  }

  ast.present = (container) => {
    const box = ast[container];
    const accumulator = [];

    if (!box) {
      log.error(`invalid container: ${container}`);
      return [];
    }

    for (let i = 0; i < box.length; i++) {
      let c = box[i];
      if (c) { accumulator.push(c) };
    }

    return accumulator;
  }

  ast.keys = (container) => {
    return Object.keys(ast[container]);
  }

  ast.node = (id) => {
    const container = container_from_type(ast.index[id].type);
    return ast[container][id];
  }

  return ast;
}

/**
 * Searches for related nodes and creates association links
 * between 2 adjacent nodes.
 *
 * @param ast {object} AST Tree
 * @param state {object} Parser State
 */
function create_association(ast, state) {
  if (state.block_start || state.inside[DEF]) {
    let related = find_common_precedence(ast, state, state.node);

    if (related) {
      associate_nodes(ast, state.node, related);
    }
  }
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
function process_node(ast, state, type) {
  const ref_type = state.config[type].ref;
  const ref_id = state.previous[ref_type];
  const index = state.current[type];
  const index_data = { node_id: index, type: type };

  let container;
  let node;

  if (type == MEMB) {
    const pnode = ast.node(state.current[DEF]);
    index_data.parent = pnode.id;

    node = create_node(state.lno,
                       { node_type: MEMB });
    ast.members[node.id] = node;

    if (!pnode.mindex) { pnode.mindex = {} };

    pnode.mindex[parseInt(state.lno)] = node.id;
    log.error(pnode.mindex[6])

  } else {
    container = state.config[type].container;
    node = cached_node(ast, index, container, {
      node_type: type,
      assoc_type: ref_type,
      assoc_id: ref_id
    });
  }

  node.data.push(state.current_line);
  ast.index[state.lno] = index_data;
  return node;
}

/**
 * Analyzes current line for tokens.
 * State is then setup dependent on scope and depth.
 *
 * @param ast {object} AST Tree
 * @param state {object} Parser State
 */
function tokenizer(ast, state) {
  const inside = 0 ||
        state.inside[CODE] ||
        state.inside[COMM] ||
        state.inside[DEF];

  if (!inside && state.ln.indexOf("/**") >= 0) {
    state.current[COMM] = state.lno;
    state.inside[COMM] = true;
    state.block_start = true;
  }

  else if (state.ln.indexOf("*/") >= 0) {
    state.inside[COMM] = false;
    state.closing[COMM] = true;
  }

  else if (!state.inside[COMM]) {

    if (!state.inside[CODE]  && state.ln.indexOf("//") == 0) {
      state.current[COMM] = state.lno;
      state.closing[COMM] = true;
      state.block_start = true;
    }

    else if (!state.inside[DEF] &&
             (state.ln.match(REGEX.c_struct_decl) ||
              state.ln.match(REGEX.c_enum_decl))) {
      state.inside[DEF] = true;
      state.current[DEF] = state.lno;
      state.block_start = true;

      // Bump code depth automatically depending on brace style
      if (state.ln.indexOf("{") >= 0) {
        state.depth = 1;
      }
    }

    else if (state.ln.match(REGEX.c_fn_decl)) {
      state.current[CODE] = state.lno;

      // Handle one line declarations
      if (state.ln.indexOf(';') >= 0) {
        state.closing[CODE] = true;
      } else {
        state.inside[CODE] = true;
        state.block_start = true;
      }

      // Bump code depth automatically depending on brace style
      if (state.ln.indexOf("{") >= 0) {
        state.depth = 1;
      }

    } else if (!inside) {
      // log(state.lno + 1, ln);
      ast.index[state.lno] = { node_id: state.lno, type: CHAR }
      ast.source[state.lno] = state.current_line;
      state.lno++;
      return;
    }
  }

}

/**
 * Scope Depth processor.
 * Tracks opening and closing of scopes within defined tokens.
 * A main root scope is tracked along with inner scopes.
 *
 * @param ast {object} AST Tree
 * @param state {object} Parser State
*/
function scope_depths(ast, state) {
  // Detect closing scope depths
  const scope_open = (state.ln.match(/{/g) || []).length;
  const scope_close = (state.ln.match(/}/g) || []).length;
  const scope_delta =  (scope_close - scope_open) - state.depth;

  if (state.inside[CODE] || state.inside[DEF]) {
    // Close the scope if ; or } is present for struct / func respectively
    if (scope_delta == 0) {
      state.depth = 0;

      // Handle definition before code points for nesting realization
      if (state.inside[DEF]) {
        if (state.ln.indexOf(';') >= 1) {
          log.error("closing def");
          state.inside[DEF] = false;
          state.closing[DEF] = true;
        }
      }

      else if (state.inside[CODE] && state.ln.indexOf('}') >= 0) {
        state.inside[CODE] = false;
        state.closing[CODE] = true;
      }

    } else if (scope_open > scope_close) {
      // Increasing scope depth
      state.depth++
    }
  }
}

/**
* Iterates scope tracking state, preparing for the next round.
 *
 * @param ast {object} AST Tree
 * @param state {object} Parser State
*/
function scope_iterate(ast, state) {
  if (state.closing[DEF]) {
    state.previous[DEF] = state.current[DEF];
    state.current[DEF] = null;
  }

  if (state.closing[CODE]) {
    state.previous[CODE] = state.current[CODE];
    state.current[CODE] = null;
  }

  if (state.closing[COMM]) {
    state.previous[COMM] = state.current[COMM];
    state.current[COMM] = null;
  }
}

/**
 * Processes line state into a node for AST insertion.
 *
 * @param ast {object} AST Tree
 * @param state {object} Parser State
*/
function insert_node(ast, state) {
  const prev_index = ast.index[state.lno - 1];
  const prev_line = prev_index && ast.source[state.lno - 1];

  if (!state.inside[DEF] && (state.inside[COMM] || state.closing[COMM])) {
    state.node = process_node(ast, state, COMM);
  }

  else if (state.inside[CODE] || state.closing[CODE]) {
    state.node = process_node(ast, state, CODE);

    if (prev_index && prev_index.type == DEF || prev_index.type == CHAR) {
      transform_node(ast, prev_index.node_id, prev_index.type, CODE);
      combine_nodes(ast, ast.code[prev_index.node_id], ast.code[state.lno]);
      state.current[CODE] = prev_index.node_id;
      state.previous[CODE] = null;
    }
  }

  else if (state.inside[DEF] || state.closing[DEF]) {
    // Combine internal comments
    if (!state.closing[DEF] && state.ln.indexOf("//") == 0) {
      state.node = process_node(ast, state, COMM);

      if (prev_index && prev_index.type == COMM) {
        combine_nodes(ast, ast[COMM][prev_index.node_id], state.node);
      }
    }

    // Look for internal struct members
    else if (!state.closing[DEF] && !state.block_start &&
        state.ln.length > 1)
    {
      state.current[MEMB] = state.lno;
      state.node = process_node(ast, state, MEMB);
      state.current[MEMB] = null;
    }

    else {
      state.node = process_node(ast, state, DEF);
    }
  }

  else {
    log.error("non-reachable: unknown state",
              { no: state.lno + 1, line: state.current_line });
  }
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
    delete ast[container][n2.id];
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
  if (node.type == CODE ||
      node.type == CHAR ||
      node.type == DEF ||
      node.type == MEMB) {
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
}

/**
 *  Transforms input into AST redirected to stdout.
 *
 * @return {boolean} operation success flag
 **/
async function ast_from_file(input) {
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
 * Define AST interface
 */
export {
  // Higher order api functions
  ast_from_file,

  // AST generation
  gen_ast,

  // Constants
  CODE,
  COMM,
  DEF,
  MEMB,
  CHAR,
  NA
}
