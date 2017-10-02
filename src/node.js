/**
 * @fileOverview
 *
 * @name node.js
 * @author Bailey Cosier <bailey@cosier.ca>
 * @license MIT
 */

const C = require('./constants');

/**
 * Create new textual node representation for the AST.
 *
 * @param {number} id identifying starting line for this node.
 * @param {string} assoc_type identifying associate reference type.
 * @param {number} assoc_id identifying associate reference id.
 *
 * @return {object} AST Node
 */
function create(id,
    { node_type, assoc_type, assoc_id, ...extra }) {
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
function cached(ast, index, container, opts) {
    let node = ast[container][index];

    if (!node) {
        node = create(index, opts);
        ast[container][index] = node;
    }

    return node;
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
function index(ast, state, type, opts = {}) {
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
function insert(ast, state) {
    const prev_index = ast.index[state.lno - 1];
    const prev_line = prev_index && ast.source[state.lno - 1] || '';

    const comm_starting = state.ln.indexOf('/*') == 0;
    const prev_comm_ended = prev_line.indexOf('*/') >= 0;

    let diff_comm_types;
    // Compare the current line against previous line for varying C.COMMent types
    if (state.ln.indexOf('//') == 0 && prev_line.indexOf('//') < 0) {
        diff_comm_types = true;
    }

    if (!state.inside[C.DEF] && (state.inside[C.COMM] || state.closing[C.COMM])) {
        process(ast, state, C.COMM);

        if (!C.COMM_starting && !diff_comm_types && prev_index && prev_index.type == C.COMM) {
            let target = ast[C.COMM][prev_index.node_id];

            if (!target) {
                log.error('Missing target', state.lno, prev_index.node_id);
            }

            combine(ast, target, state.node);
        }
    } else if (state.inside[C.CODE] || state.closing[C.CODE]) {
        process(ast, state, C.CODE);

        if (prev_index && (prev_index.type == C.DEF || prev_index.type == C.CHAR)) {
            transform(ast, prev_index.node_id, prev_index.type, C.CODE);
            combine(ast, ast.C.CODE[prev_index.node_id], ast.C.CODE[state.lno]);
            state.current[C.CODE] = prev_index.node_id;
            state.previous[C.CODE] = null;
        }
    } else if (state.inside[C.DEF] || state.closing[C.DEF]) {
        // Combine internal C.COMMents
        if (!state.closing[C.DEF] && (state.inside[C.COMM] || state.closing[C.COMM])) {
            process(ast, state, C.COMM);

            if (!prev_comm_ended && !diff_comm_types && prev_index &&
                prev_index.type == C.COMM) {
                combine(ast, ast[C.COMM][prev_index.node_id], state.node);
            }
        }

        // Look for internal struct C.MEMBers
        else if (!state.closing[C.DEF] && !state.block_start &&
            state.ln.length > 1) {
            state.current[C.MEMB] = state.lno;
            process(ast, state, C.MEMB);
            state.current[C.MEMB] = null;
        } else {
            process(ast, state, C.DEF);
        }
    } else {
        log.error('non-reachable: unknown state',
            { no: state.lno + 1, line: state.current_line });
    }
}

/**
 * Handle node insertions.
 * Updates given AST with optional node insertion and data push.
 *
 * @param {object} ast Abstract Syntax Tree
 * @param {object} state Shared runtime state and config
 * @param {string} type node type identifier, possible options: 'C.COMM' or 'C.CODE'.
 *
 * @return {object} AST Node
 */
function process(ast, state, type) {
    const ref_type = state.config[type].ref;
    const ref_id = state.previous[ref_type];
    const ind = state.current[type];
    const index_data = {};

    let container;
    let node;

    if (type == C.MEMB) {
        const pnode = ast.node(state.current[C.DEF]);
        index_data.parent = pnode.id;

        node = create(state.lno,
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
        node = cached(ast, ind, container, {
            node_type: type,
            assoc_type: ref_type,
            assoc_id: ref_id,
        });
    }

    state.node = node;
    state.node.data.push(state.current_line);
    state.previous[ref_type] = null;

    index(ast, state, type, index_data);
    return node;
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
function transform(ast, index, from, dst) {
    const node = ast[dst][index] = ast[from][index];
    delete ast[from][index];

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
function combine(ast, no1, no2) {
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

    const container = n2.type;
    if (ast[container][n2.id]) {
        delete ast[container][n2.id];
    } else {
        log.error(`Could not find node inside [${n2.node_type}]`);
    }
}

module.exports = {
    cached,
    create,
    process,
    index,
    insert,
    transform,
    combine
}