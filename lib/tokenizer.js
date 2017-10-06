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

  if (!inside && state.ln.indexOf('/*') == 0) {
    state.current[C.COMM] = state.lno;

    if (state.ln.indexOf('*/') >= 0) {
      state.closing[C.COMM] = true;
    } else {
      state.inside[C.COMM] = true;
      state.block_start = true;
    }
  }

  else if (!state.inside[C.CODE] && state.ln.indexOf('//') == 0) {
    state.current[C.COMM] = state.lno;
    state.closing[C.COMM] = true;
    state.block_start = true;
  }

  else if (state.inside[C.COMM] && state.ln.indexOf('*/') >= 0) {
    delete state.inside[C.COMM];
    state.closing[C.COMM] = true;
  }

  else if (!state.inside[C.COMM]) {
    return tokenize_code(ast, state);
  }
}

/**
 *  Tokenize code and definition structures
 * @param {AST} ast
 * @param {State} state
 */
function tokenize_code(ast, state) {
  const in_def = state.inside[C.DEF];
  const in_code = state.inside[C.CODE];

  const match_func = state.ln.match(REGEX.c_fn_decl);
  const match_struct = state.ln.match(REGEX.c_struct_decl);
  const match_enum = state.ln.match(REGEX.c_enum_decl);

  if (!in_def && !in_code && !match_func && (match_struct || match_enum)) {
    state.current[C.DEF] = state.lno;
    state.inside[C.DEF] = true;
    state.block_start = true;
  }

  else if (!in_def && !in_code && match_func) {
    state.current[C.CODE] = state.lno;

    // Handle one line declarations
    if (state.depth == 0 && state.ln.indexOf(';') >= 0) {
      state.closing[C.CODE] = true;
    } else {
      state.inside[C.CODE] = true;
      state.block_start = true;
    }
  }

  else if (in_def) {
    if (state.depth == 0) {
      // if (state.ln.indexOf('{') == 0) {
        // node.index(ast, state, C.DEF, { node_id: state.lno });
      // }

      // else if (state.ln.indexOf('}') >= 0) {
        // node.index(ast, state, C.DEF, { node_id: state.lno });
      // }

      // Transform partial DEF into CODE node if partial function signature match
      if (match_func) {
        node.transform(ast, state.current[C.DEF], C.DEF, C.CODE);

        state.current[C.CODE] = state.current[C.DEF];
        state.previous[C.CODE] = state.previous[C.DEF];
        state.inside[C.CODE] = true;

        delete state.previous[C.DEF];
        delete state.current[C.DEF];
        delete state.inside[C.DEF];
      }
    }
  }

  else if (in_code) {
    
  }

  else {
    // node.index(ast, state, C.CHAR, { node_id: state.lno });
  }
}

/* Expose tokenizer interface */
module.exports = tokenizer;