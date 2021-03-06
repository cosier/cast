/**
 * @fileOverview
 *
 * @name node.js
 * @author Bailey Cosier <bailey@cosier.ca>
 * @license MIT
 */
const proc = require('process');
const logger = require('./utils').logger;
const C = require('./constants');
/**
 * Utility log namespaced helper
 */
const log = logger('node');

/**
 * Traverse ast tree upwards until the root is found
 * @param {object} ast tree object
 * @param {string|number} id node id
 */
function root(ast, id) {
    const lookup = ast.index[id];
    if (lookup.parent) {
        return root(ast, lookup.parent);
    } else {
        const node = ast[lookup.type][lookup.node_id];
        return node;
    }
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
function create(id,
    { node_type, assoc_type, assoc_id, ...extra }) {
    // Prepare initial association references
    let assoc_container = {};

    if (node_type != C.COMM && assoc_id) {
        assoc_container[assoc_type] = [assoc_id];
    }

    return {
        id: id,
        type: node_type,
        assocs: assoc_container,
        data: {},
        // inner: [],
        // index: {},
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
        log.error('invalid state.node:', {
            state, node_id, type, ln: state.ln, lno: state.lno
        });

        console.trace();
        proc.exit(1);
    }

    const data = {
        node_id: node_id,
        type: type,
        // line: state.ln,
        sub: []
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

        if (!comm_starting && !diff_comm_types && prev_index && prev_index.type == C.COMM) {
            let target = ast[C.COMM][prev_index.node_id];

            if (!target) {
                log.error('Missing target', state.lno, prev_index.node_id);
            }

            combine(ast, target, state.node);
        }
    }

    else if (state.inside[C.CODE] || state.closing[C.CODE]) {
        process(ast, state, C.CODE);

        if (prev_index && (prev_index.type == C.DEF || prev_index.type == C.CHAR)) {
            transform(ast, prev_index.node_id, prev_index.type, C.CODE);
            combine(ast, ast[C.CODE][prev_index.node_id], ast[C.CODE][state.lno]);
            if (prev_index.node_id) {
                state.current[C.CODE] = prev_index.node_id;
            }

            state.previous[C.CODE] = null;
        }
    }

    else if (state.inside[C.DEF] || state.closing[C.DEF]) {
        // Combine internal comments
        if (!state.closing[C.DEF] && (state.inside[C.COMM] || state.closing[C.COMM])) {
            process(ast, state, C.COMM);

            if (!prev_comm_ended && !diff_comm_types && prev_index &&
                prev_index.type == C.COMM) {
                combine(ast, ast[C.COMM][prev_index.node_id], state.node);
            }
        }

        // Look for internal struct members
        else if (!state.closing[C.DEF] && !state.block_start &&
            state.ln.length > 1) {
            state.current[C.MEMB] = state.lno;
            process(ast, state, C.MEMB);
            state.current[C.MEMB] = null;
        } else {
            process(ast, state, C.DEF);
        }
    }

    else {
        state.current[C.CHAR] = state.lno;
        state.closing[C.CHAR] = true;
        process(ast, state, C.CHAR);
    }
}

/**
 * Extract inner comment from  a node sub member.
 *
 * @param {AST} ast master ast tree
 * @param {Node} node containing extractable comment
 */
function extract_inner_comment(ast, node, subline = 0) {
    const sub_keys = Object.keys(node.data);
    const ln = node.data[sub_keys[subline]];
    const pos = parseInt(node.id) + subline;

    let ctype = "//";
    if (ln.indexOf("/*") >= 0) {
        ctype = "/*";
    }

    const extract = ln.split(ctype)
    const data = extract[0];
    const comm = ctype + extract[1];

    node.data[subline] = data;
    if (!node.inner) { node.inner = []; }
    cid = node.inner.length;

    cnode = create(`${pos}.${cid + 1}`, {
        node_type: C.COMM,
        assoc_type: node.type,
        assoc_id: node.id,
        parent: node.id,
    });

    cnode.data[node.id] = comm;

    node.inner.push(cnode);

    if (!node.index) { node.index = {} }
    node.index[cnode.id] = { ind: cid, type: C.COMM }

    ast[C.COMM][cnode.id] = cnode;
    ast.index[cnode.id] = {
        node_id: cnode.id,
        type: C.COMM,
        // line: cnode.data[0],
        parent: node.id,
        ind: cid,
    }
}

/**
 * Process inner nodes, ie. members of a struct
 * @param {*} ast
 * @param {*} state
 * @param {*} pnode
 * @param {*} type
 */
function inner(ast, state, pnode, type) {
    const node = create(state.lno,
        {
            node_type: type,
            parent: pnode.id,
        });

    const inner_id = pnode.inner.length;
    let ln = state.current_line;

    pnode.inner.push(node);
    if (!pnode.index) { pnode.index = {}; }
    pnode.index[state.lno] = {
        ind: inner_id,
        type: type,
    };

    node.data[state.lno] = ln;

    // Scan for sub line comments: indexed > 1
    if (ln.indexOf("/*") >= 1 || ln.indexOf("//") >= 1) {
        extract_inner_comment(ast, node)
    }

    return node;
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
    const ref_node = ast[ref_type][ref_id];
    const ind = state.current[type];
    const index_data = {};

    let container;
    let node;

    if (type == C.MEMB) {
        const pnode = ast.node(state.current[C.DEF]);
        index_data.parent = pnode.id;
        if (!pnode.inner) { pnode.inner = []; }
        index_data.ind = pnode.inner.length;
        node = inner(ast, state, pnode, type);

    } else {
        container = state.config[type].container;
        node = cached(ast, ind, container, {
            node_type: type,
            assoc_type: ref_type,
            assoc_id: ref_id,
        });

        if (type != C.COMM && ref_node) {
            associate(ast, ref_node, node);
        }

        //node.data.push({no: state.lno, ln: state.current_line });
        node.data[state.lno] = state.current_line;
    }

    state.node = node;
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
    ast[dst][index] = ast[from][index];
    delete ast[from][index];

    const lookup = ast.index[index];
    const node = ast[dst][lookup.node_id];
    lookup.type = dst;
    node.type = dst;

    if (!node || !node.type) {
        log.error(`Invalid transform on node(${index})`, node, ast.index[index]);
        console.trace();
        proc.exit(1);
    }

    for (assoc in node.assocs) {
        for (i in node.assocs[assoc]) {
            let id = node.assocs[assoc][i];
            let n = ast[assoc][id];
            let len = n.assocs[from].length;
            let clean_orig = false;

            for (i2 in n.assocs[from]) {
                if (n.assocs[from][i2] == node.id) {
                    delete n.assocs[from][i2];
                    clean_orig = true;
                }
            }
            if (len <= 1 && clean_orig) {
                delete n.assocs[from];
            }
            if (!n.assocs[dst]) {
                n.assocs[dst] = [];
            }

            n.assocs[dst].push(node.id);
        }
    }
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
        console.trace();
        proc.exit(1);
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
    for (entry in n2.data) {
        ast.index[entry].node_id = n1.id;
    }

    Object.assign(n1.data, n2.data);

    const container = n2.type;
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
function find_precedence(ast, state, node) {
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
function associate(ast, node, related) {
    const ntype = related.type;
    const rtype = node.type;

    // Initiate assoc structures
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

module.exports = {
    create,
    cached,
    root,
    process,
    index,
    insert,
    transform,
    combine,
    associate,
    find_precedence
}
