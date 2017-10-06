/**
 * @fileOverview
 *
 * @name scope.js
 * @author Bailey Cosier <bailey@cosier.ca>
 * @license MIT
 */

const C = require('./constants');

/**
 * Scope Depth processor.
 * Tracks opening and closing of scopes within C.DEFined tokens.
 * A main root scope is tracked along with inner scopes.
 *
 * @param {object} ast tree
 * @param {object} state Parser State
*/
function depths(ast, state) {
    // Detect closing scope depths
    const scope_open = (state.ln.match(/{/g) || []).length;
    const scope_close = (state.ln.match(/}/g) || []).length;
    const scope_delta = (scope_close - scope_open) - state.depth;
    const closing = state.ln.indexOf('}') >= 0;

    if (state.inside[C.CODE] || state.inside[C.DEF]) {
      // Close the scope if ; or } is present for struct / func respectively
      if (scope_delta == 0) {
        state.depth = 0;
  
        // Handle definitions before C.CODE points for nesting realization
        if (state.inside[C.DEF]) {
          if (state.ln.indexOf(';') >= 1 || (closing && scope_delta == 0)) {
            delete state.inside[C.DEF];
            state.closing[C.DEF] = true;
          }
        } else if (state.inside[C.CODE] && closing) {
          delete state.inside[C.CODE];
          state.closing[C.CODE] = true;
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
  function iterate(ast, state) {
    if (state.closing[C.DEF]) {
      state.previous[C.DEF] = state.current[C.DEF];
      delete state.current[C.DEF];
    }
  
    if (state.closing[C.CODE]) {
      state.previous[C.CODE] = state.current[C.CODE];
      delete state.current[C.CODE];
    }
  
    if (state.closing[C.COMM]) {
      state.previous[C.COMM] = state.current[C.COMM];
      delete state.current[C.COMM];
    }

    if (state.closing[C.CHAR]) {
      state.previous[C.CHAR] = state.current[C.CHAR];
      delete state.current[C.CHAR];
    }
  }

  module.exports = {
      depths, iterate
  }