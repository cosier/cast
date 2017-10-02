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
const logger = require('./utils').logger;
const resolve = require('path');

const CHAR = 'char';
const COMM = 'comments';
const CODE = 'code';
const MEMB = 'members';
const DEF = 'defs';
const NA = 'na';
const SKIP = 'skip';

/**
 * Precompiled Regex selectors for function tokens
 */
const REGEX = {
  // C type function declaration
  c_fn_decl: /[aA0-zZ9_\s]+\(.*\)/,
  c_struct_decl: /struct[\s]+/,
  c_enum_decl: /enum[\s]+/,
};

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
  if (!state.inside[COMM] && (state.ln.indexOf('#') == 0 || state.ln == '')) {
    insert_index(ast, state, NA, { node_id: state.lno });
    // Clear comment tracking as we have introduced an association break
    state.previous[COMM] = null;
    return;
  }

  // /////////////////////////////////////////////
  // Detect tokens
  if (tokenizer(ast, state) == SKIP) {
    return;
  }

  // /////////////////////////////////////////////
  // Process scope depths
  scope_depths(ast, state);

  // /////////////////////////////////////////////
  // Handle node insertions
  insert_node(ast, state);

  // /////////////////////////////////////////////
  // Create associations
  create_association(ast, state);

  // /////////////////////////////////////////////
  // Scope iteration and cleanup
  scope_iterate(ast, state);
}

/**
 * Convert node type to container definition string
 * @param {string} type
 * @return {string} formal container type
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
 * @param {number} id identifying starting line for this node.
 * @param {string} assoc_type identifying associate reference type.
 * @param {number} assoc_id identifying associate reference id.
 *
 * @return {object} AST Node
 */
function create_node(id, { node_type, assoc_type, assoc_id, ...extra }) {
  // Prepare initial association references
  let assoc_container = {};

  if (assoc_id) {
    assoc_container[assoc_type] = [assoc_id];
  }

  return {
    id: id,
    type: node_type,
    assocs: assoc_container,
    data: [],
    inner: [],
    index: {},
    ...extra,
  };
}

/**
 * Perform a cached lookup for an indexed Node.
 * If requested node is non-existent, it will be created.
 * 
 * @param {object} ast tree
 * @param {number} index ID Index for the node, typically line no.
 * @param {string} container type.
 * @param {object} opts additional attributes for the created node.
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
      [DEF]: { ref: COMM, container: DEF },
    },
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
    index: {},
  };

  /**
   * Gets an array of keys inside the given AST container type.
   *   Possible values are constants: COMM,CODE,DEF 
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

    if (type == MEMB) {
      const p = ast.node(index.parent);
      return p.inner[index.ind];
    }

    else {
      const container = container_from_type(type);
      return ast[container][id];
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
  if (state.block_start || state.inside[DEF]) {
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
 * @return {object} AST definition
 */
function gen_ast(buffer) {
  // Create an empty ast tree to start with
  const ast = create_ast_struct();

  // Setup state for code parsing
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
 * Handle node insertions.
 * Updates given AST with optional node insertion and data push.
 *
 * @param {object} ast Abstract Syntax Tree
 * @param {object} state Shared runtime state and config
 * @param {string} type node type identifier, possible options: 'comm' or 'code'.
 *
 * @return {object} AST Node
 */
function process_node(ast, state, type) {
  const ref_type = state.config[type].ref;
  const ref_id = state.previous[ref_type];
  const index = state.current[type];
  const index_data = {};

  let container;
  let node;

  if (type == MEMB) {
    const pnode = ast.node(state.current[DEF]);
    index_data.parent = pnode.id;

    node = create_node(state.lno,
      {
        node_type: type,
        parent: pnode.id,
      });

    const inner_id = pnode.inner.length;
    index_data.ind = inner_id;

    pnode.inner.push(node);
    pnode.index[state.lno] = {
      ind: inner_id,
      type: type,
    };
  } else {
    container = state.config[type].container;
    node = cached_node(ast, index, container, {
      node_type: type,
      assoc_type: ref_type,
      assoc_id: ref_id,
    });
  }

  state.node = node;
  state.node.data.push(state.current_line);
  state.previous[ref_type] = null;

  insert_index(ast, state, type, index_data);
  return node;
}

/**
 * Analyzes current line for tokens.
 * State is then setup dependent on scope and depth.
 *
 * @param {object} ast tree
 * @param {object} state Parser State
 * @return {null|SKIP}
 */
function tokenizer(ast, state) {
  const inside = 0 ||
    state.inside[CODE] ||
    state.inside[COMM];


  if (!inside && state.ln.indexOf('/*') == 0) {
    state.current[COMM] = state.lno;

    if (state.ln.indexOf('*/') >= 0) {
      state.closing[COMM] = true;
    } else {
      state.inside[COMM] = true;
      state.block_start = true;
    }
  }

  // ///////////////////////////////////////////////////////////////////
  else if (state.inside[COMM] && state.ln.indexOf('*/') >= 0) {
    delete state.inside[COMM];
    state.closing[COMM] = true;
  }

  else if (!state.inside[COMM]) {
    
    // ///////////////////////////////////////////////////////////////////
    if (!state.inside[CODE] && state.ln.indexOf('//') == 0) {
      state.current[COMM] = state.lno;
      state.closing[COMM] = true;
      state.block_start = true;
    } else if (!state.inside[CODE] && state.ln.indexOf('/*') == 0) {
      state.current[COMM] = state.lno;

      if (state.ln.indexOf('*/') >= 0) {
        state.closing[COMM] = true;
      } else {
        state.block_start = true;
      }
    } else if (!state.inside[DEF] &&
      !state.ln.match(REGEX.c_fn_decl) &&
      (state.ln.match(REGEX.c_struct_decl) ||
        state.ln.match(REGEX.c_enum_decl))) {
      state.inside[DEF] = true;
      state.current[DEF] = state.lno;
      state.block_start = true;
    }

    // ///////////////////////////////////////////////////////////////////
    else if (!state.inside[DEF] && state.ln.match(REGEX.c_fn_decl)) {
      state.current[CODE] = state.lno;

      // Handle one line declarations
      if (state.ln.indexOf(';') >= 0) {
        state.closing[CODE] = true;
      } else {
        state.inside[CODE] = true;
        state.block_start = true;
      }
    }
    // ///////////////////////////////////////////////////////////////////
    else if (state.inside[DEF]) {
      if (state.depth == 0) {
        if (state.ln.indexOf('{') == 0) {
          insert_index(ast, state, DEF, { node_id: state.lno });
        } else if (state.ln.indexOf('}') >= 0) {
          insert_index(ast, state, DEF, { node_id: state.lno });
        }
      }
    }
    // ///////////////////////////////////////////////////////////////////
    else if (!inside) {
      insert_index(ast, state, CHAR, { node_id: state.lno });
      return SKIP;
    }
  }
}

/**
 * Scope Depth processor.
 * Tracks opening and closing of scopes within defined tokens.
 * A main root scope is tracked along with inner scopes.
 *
 * @param {object} ast tree
 * @param {object} state Parser State
*/
function scope_depths(ast, state) {
  // Detect closing scope depths
  const scope_open = (state.ln.match(/{/g) || []).length;
  const scope_close = (state.ln.match(/}/g) || []).length;
  const scope_delta = (scope_close - scope_open) - state.depth;

  if (state.inside[CODE] || state.inside[DEF]) {
    // Close the scope if ; or } is present for struct / func respectively
    if (scope_delta == 0) {
      state.depth = 0;

      // Handle definition before code points for nesting realization
      if (state.inside[DEF]) {
        if (state.ln.indexOf(';') >= 1 ||
          (state.ln.indexOf('}') >= 0 && scope_delta == 0)) {
          delete state.inside[DEF];
          state.closing[DEF] = true;
        }
      } else if (state.inside[CODE] && state.ln.indexOf('}') >= 0) {
        delete state.inside[CODE];
        state.closing[CODE] = true;
      }
    } else if (scope_open > scope_close) {
      // Increasing scope depth
      state.depth++;
    }
  }
}

/**
* Iterates scope tracking state, preparing for the next round.
 *
 * @param {object} ast Tree
 * @param {object} state Parser State
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
 * 
 * Inserts entry into the index based on current state
 * and provided {type}
 * 
 * @param {object} ast 
 * @param {object} state 
 * @param {string} type 
 * @param {object} opts 
 */
function insert_index(ast, state, type, opts = {}) {
  let node_id = opts.node_id;
  if (state.node) {
    node_id = state.node.id;
  }

  if (!node_id && node_id != 0) {
    log.error('invalid state.node:',
      node_id, type, state.ln, state.lno);
    process.exit(1);
  }

  const data = {
    node_id: node_id,
    type: type,
    line: state.current_line,
  };

  if (opts) {
    for (let k in opts) {
      if (opts.hasOwnProperty.call(opts, k)) {
        data[k] = opts[k];
      }
    }
  }

  ast.index[state.lno] = data;
}

/**
 * Processes line state into a node for AST insertion.
 *
 * @param {object} ast tree
 * @param {object} state Parser State
*/
function insert_node(ast, state) {
  const prev_index = ast.index[state.lno - 1];
  const prev_line = prev_index && ast.source[state.lno - 1] || '';

  const comm_starting = state.ln.indexOf('/*') == 0;
  const prev_comm_ended = prev_line.indexOf('*/') >= 0;

  let diff_comm_types;
  log.cyan('insert_node', state.ln);
  // Compare the current line against previous line for varying comment types
  if (state.ln.indexOf('//') == 0 && prev_line.indexOf('//') < 0) {
    diff_comm_types = true;
  }

  if (!state.inside[DEF] && (state.inside[COMM] || state.closing[COMM])) {
    process_node(ast, state, COMM);

    if (!comm_starting && !diff_comm_types && prev_index && prev_index.type == COMM) {
      let target = ast[COMM][prev_index.node_id];

      if (!target) {
        log.error('Missing target', state.lno, prev_index.node_id);
      }

      combine_nodes(ast, target, state.node);
    }
  } else if (state.inside[CODE] || state.closing[CODE]) {
    process_node(ast, state, CODE);

    if (prev_index && (prev_index.type == DEF || prev_index.type == CHAR)) {
      transform_node(ast, prev_index.node_id, prev_index.type, CODE);
      combine_nodes(ast, ast.code[prev_index.node_id], ast.code[state.lno]);
      state.current[CODE] = prev_index.node_id;
      state.previous[CODE] = null;
    }
  } else if (state.inside[DEF] || state.closing[DEF]) {
    // Combine internal comments
    if (!state.closing[DEF] && (state.inside[COMM] || state.closing[COMM])) {
      process_node(ast, state, COMM);

      if (!prev_comm_ended && !diff_comm_types && prev_index &&
        prev_index.type == COMM) {
        combine_nodes(ast, ast[COMM][prev_index.node_id], state.node);
      }
    }

    // Look for internal struct members
    else if (!state.closing[DEF] && !state.block_start &&
      state.ln.length > 1) {
      console.error('internal struct members:', state.ln);
      state.current[MEMB] = state.lno;
      process_node(ast, state, MEMB);
      state.current[MEMB] = null;
    } else {
      process_node(ast, state, DEF);
    }
  } else {
    log.error('non-reachable: unknown state',
      { no: state.lno + 1, line: state.current_line });
  }
}

/**
 * Transform a node between various node nodes in the tree.
 *
 * @param {object} ast object tree
 * @param {number} index into AST for the target node
 * @param {string} from - Type of node we are transforming
 * @param {string} dst - Destination Type for the Node
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
 * @param {object} ast Tree
 * @param {object} no1 - Node 1
 * @param {object} no2 - Node 2
 *
 * @return {void}
 */
function combine_nodes(ast, no1, no2) {
  let n1;
  let n2;

  if (!no1 || !no1.id && no1.id != 0) {
    log.error('Missing node.id (no1)');
    process.exit(1);
  }

  // Multiline blocks will run into this scenario.
  if (no1.id === no2.id) {
    return;
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
    delete ast[container][n2.id];
  } else {
    log.error(`Could not find node inside [${n2.node_type}]`);
  }
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

  if (node.type == CODE ||
    node.type == CHAR ||
    node.type == DEF ||
    node.type == MEMB) {
    let prev_index = ast.index[node.id - 1];

    if (!prev_index) {
      log.error('invalid prev_index');
      return;
    }

    let prev_comm_id = prev_index.node_id;
    let lookup = ast.index[prev_comm_id];

    if (lookup && lookup.type == COMM) {
      container = container_from_type(lookup.type);
      match = ast[container][lookup.node_id];
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
 * Define AST interface
 */
module.exports = {
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
  NA,
};
