/**
 * @fileOverview
 * Orchestrates the processing of an input file.
 * From AST generation to final String product.
 *
 * @name processor.js
 * @author Bailey Cosier <bailey@cosier.ca>
 * @license MIT
 */

const fs = require('fs');
const exists = fs.existsSync;

const readline = require('readline');
const resolve = require('path');

const logger = require('./utils').logger;
const tokenizer = require('./tokenizer');
const scope = require('./scope');
const node = require('./node');
const C = require('./constants');

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
 * @param {object} ast Abstract Syntax Tree
 * @param {object} state shared runtime and config
 * @param {string} line being fed in this iteration.
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

  // /////////////////////////////////////////////
  // Ignore non-applicable lines
  if (!state.inside[C.COMM] && (state.ln.indexOf('#') == 0 || state.ln == '')) {
    node.index(ast, state, C.NA, { node_id: state.lno });
    // Clear C.COMMent tracking as we have introduced an association break
    state.previous[C.COMM] = null;
    return;
  }

  // /////////////////////////////////////////////
  // Detect tokens
  if (tokenizer(ast, state) == C.SKIP) {
    return;
  }

  // /////////////////////////////////////////////
  // Process scope depths
  scope.depths(ast, state);

  // /////////////////////////////////////////////
  // Handle node insertions
  node.insert(ast, state);

  // /////////////////////////////////////////////
  // Create associations
  create_association(ast, state);

  // /////////////////////////////////////////////
  // Scope iteration and cleanup
  scope.iterate(ast, state);
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
      [C.COMM]: { ref: C.CODE, container: C.COMM },
      [C.CODE]: { ref: C.COMM, container: C.CODE },
      [C.MEMB]: { ref: C.DEF, container: C.DEF },
      [C.DEF]: { ref: C.COMM, container: C.DEF },
    },
  };
}

/**
 * Creates an AST structure with internal book keeping methods
 * @return {object} Empty AST C.DEFinition
 */
function create_ast_struct() {
  const ast = {
    source: [],
    [C.COMM]: {},
    [C.CODE]: {},
    [C.DEF]: {},
    index: {},
  };

  /**
   * Gets an array of keys inside the given AST container type.
   *   Possible values are constants: C.COMM,C.CODE,C.DEF
   *
   * @param {string} container type of AST container.
   * @return {array} array of item keys inside the container
   */
  ast.keys = (container) => {
    return Object.keys(ast[container]);
  };

  /**
   * Get inner elements of a given node id.
   * If type is provided, only those matching the type id will be returned.
   *
   * @param {number} pid Id of the node
   * @param {string|optional} type Type of the inner node to be returned.
   * @return {Array} results of inner elements
   */
  ast.inner = (pid, type) => {
    const n = ast.node(pid);
    const results = [];
    for (let i = 0; i < n.inner.length; i++) {
      let item = n.inner[i];
      if (!type || (item && item.type == type)) {
        results.push(item);
      }
    }
    return results;
  };

  ast.count = (container) => {
    const c = ast.keys(container).length;
    return { [container]: c };
  };

  ast.node = (id) => {
    const index = ast.index[id];
    const type = index.type;

    if (type == C.MEMB) {
      const p = ast.node(index.parent);
      return p.inner[index.ind];
    }

    else {
      return ast[type][id];
    }
  };

  return ast;
}

/**
 * Searches for related nodes and creates association links
 * between 2 adjacent nodes.
 *
 * @param {object} ast tree
 * @param {object} state parser state
 */
function create_association(ast, state) {
  if (state.block_start || state.inside[C.DEF]) {
    let related = find_common_precedence(ast, state, state.node);

    if (related) {
      associate_nodes(ast, state.node, related);
    }
  }
}

/**
 * Parses input file path and returns AST result.
 * @param {string} ipath filename
 * @return {object} ast tree
 */
async function process_ast(ipath) {
  // Stream input into a sizable buffer to work with,
  // Consuming the stream line by line.
  const reader = readline.createInterface({
    input: fs.createReadStream(ipath),
    console: false,
  });

  const ast = await gen_ast(reader);
  return ast;
}

/**
 * Generate an Abstract Syntax Tree from source buffer stream
 *
 * @param {buffer} buffer input
 * @return {object} AST C.DEFinition
 */
function ast_gen(buffer) {
  // Create an empty ast tree to start with
  const ast = create_ast_struct();

  // Setup state for C.CODE parsing
  const state = create_state();

  // Asyncronously process our buffer into an AST
  const compute = new Promise((resolve, reject) => {
    buffer.on('line', (line) => {
      if (PANIC) {
        return;
      }
      process_line(ast, state, line);
    });

    buffer.on('close', (fin) => {
      resolve(ast);
    });
  });

  return compute;
}

/**
 * Finds related nodes preceding the target node for association.
 *
 * @param {object} ast - AST Tree to operate on
 * @param {object} state - Parser State
 * @param {object} node - AST node object
 *
 * @return {object} Matched AST node
 */
function find_common_precedence(ast, state, node) {
  let container;
  let match;

  if (node.type == C.CODE ||
    node.type == C.CHAR ||
    node.type == C.DEF ||
    node.type == C.MEMB) {

    let prev_index = ast.index[node.id - 1];

    if (!prev_index) {
      log.error('invalid prev_index');
      return;
    }

    let prev_comm_id = prev_index.node_id;
    let lookup = ast.index[prev_comm_id];

    if (lookup && lookup.type == C.COMM) {
      match = ast[lookup.type][lookup.node_id];
    }
  }

  return match;
}

/**
* Link two nodes together via recipricol association.
*
* @param {object} ast - AST Tree to operate on
* @param {object} node - AST Node object
* @param {object} related -AST Node object
*
* @return {void}
*/
function associate_nodes(ast, node, related) {
  const ntype = related.type;
  const rtype = node.type;

  if (!node.assocs[ntype]) node.assocs[ntype] = [];
  if (!related.assocs[rtype]) related.assocs[rtype] = [];

  const rcontains = related.assocs[rtype].indexOf(node.id);
  const ncontains = node.assocs[ntype].indexOf(related.id);

  if (rcontains < 0) {
    related.assocs[rtype].push(node.id);
  }

  if (ncontains < 0) {
    node.assocs[ntype].push(related.id);
  }
}

/**
 *  Transforms input into AST redirected to stdout.
 * @param {string} input - file path input
 * @return {boolean} operation success flag
 **/
async function ast_from_file(input) {
  const ipath = resolve(input);

  if (!exists(ipath)) {
    log.error(`Invalid input file: ${input}`);
    return false;
  }

  const result = await process_ast(ipath);
  return result;
}

/**
 * C.DEFine AST interface
 */
module.exports = {
  // Higher order api functions
  ast_from_file,

  // AST generation
  ast_gen
};
