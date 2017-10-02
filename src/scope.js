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
  
    if (state.inside[C.CODE] || state.inside[C.DEF]) {
      // Close the scope if ; or } is present for struct / func respectively
      if (scope_delta == 0) {
        state.depth = 0;
  
        // Handle C.DEFinition before C.CODE points for nesting realization
        if (state.inside[C.DEF]) {
          if (state.ln.indexOf(';') >= 1 ||
            (state.ln.indexOf('}') >= 0 && scope_delta == 0)) {
            delete state.inside[C.DEF];
            state.closing[C.DEF] = true;
          }
        } else if (state.inside[C.CODE] && state.ln.indexOf('}') >= 0) {
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
      state.current[C.DEF] = null;
    }
  
    if (state.closing[C.CODE]) {
      state.previous[C.CODE] = state.current[C.CODE];
      state.current[C.CODE] = null;
    }
  
    if (state.closing[C.COMM]) {
      state.previous[C.COMM] = state.current[C.COMM];
      state.current[C.COMM] = null;
    }
  }

  module.exports = {
      depths, iterate
  }