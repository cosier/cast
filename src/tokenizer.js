/**
 * @fileOverview
 * Parses lines into tokenized state markers.
 *
 * @name tokenizer.js
 * @author Bailey Cosier <bailey@cosier.ca>
 * @license MIT
 */

const logger = require('./utils').logger;
const node = require('./node');
const C = require('./constants');

/**
 * Utility log namespaced helper
 */
const log = logger('tokenizer');

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
 * Analyzes current line for tokens.
 * State is then setup dependent on scope and depth.
 *
 * @param {object} ast tree
 * @param {object} state Parser State
 * @return {null|SKIP}
 */
function tokenizer(ast, state) {
  const inside = 0 ||
    state.inside[C.CODE] ||
    state.inside[C.COMM];

  log(`depth: ${state.depth} -> ${state.ln}`)

  if (!inside && state.ln.indexOf('/*') == 0) {
    state.current[C.COMM] = state.lno;

    if (state.ln.indexOf('*/') >= 0) {
      state.closing[C.COMM] = true;
    } else {
      state.inside[C.COMM] = true;
      state.block_start = true;
    }
  }

  else if (state.inside[C.COMM] && state.ln.indexOf('*/') >= 0) {
    delete state.inside[C.COMM];
    state.closing[C.COMM] = true;
  }

  else if (!state.inside[C.COMM]) {
    tokenize_code(ast, state);
  }
}

/**
 *  Tokenize code and definition structures
 * @param {AST} ast 
 * @param {State} state 
 */
function tokenize_code(ast, state) {
  // ///////////////////////////////////////////////////////////////////
  if (!state.inside[C.CODE] && state.ln.indexOf('//') == 0) {
    state.current[C.COMM] = state.lno;
    state.closing[C.COMM] = true;
    state.block_start = true;
  }

  // ///////////////////////////////////////////////////////////////////
  else if (!state.inside[C.CODE] && state.ln.indexOf('/*') == 0) {
    state.current[C.COMM] = state.lno;

    if (state.ln.indexOf('*/') >= 0) {
      state.closing[C.COMM] = true;
    } else {
      state.block_start = true;
    }
  }

  // ///////////////////////////////////////////////////////////////////
  else if (!state.inside[C.DEF] &&
    !state.ln.match(REGEX.c_fn_decl) &&
    (state.ln.match(REGEX.c_struct_decl) ||
      state.ln.match(REGEX.c_enum_decl))) {

    state.current[C.DEF] = state.lno;
    state.inside[C.DEF] = true;
    state.block_start = true;

  }

  // ///////////////////////////////////////////////////////////////////
  else if (!state.inside[C.DEF] && state.ln.match(REGEX.c_fn_decl)) {
    state.current[C.CODE] = state.lno;

    // Handle one line declarations
    if (state.ln.indexOf(';') >= 0) {
      state.closing[C.CODE] = true;
    } else {
      state.inside[C.CODE] = true;
      state.block_start = true;
    }
  }
  // ///////////////////////////////////////////////////////////////////
  else if (state.inside[C.DEF]) {
    if (state.depth == 0) {
      if (state.ln.indexOf('{') == 0) {
        node.index(ast, state, C.DEF, { node_id: state.lno });
      } else if (state.ln.indexOf('}') >= 0) {
        node.index(ast, state, C.DEF, { node_id: state.lno });
      }
    }
  }
  // ///////////////////////////////////////////////////////////////////
  else if (!inside) {
    node.index(ast, state, C.CHAR, { node_id: state.lno });
    return C.SKIP;
  }
}

/* Expose tokenizer interface */
module.exports = tokenizer;