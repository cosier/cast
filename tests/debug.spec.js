/**
 * @fileOverview
 * Debug Table
 * Used for one off test examination
 *
 * @name debug.spec.js
 * @author Bailey Cosier <bailey@cosier.ca>
 * @license MIT
 */

const chai = require('chai')
const expect = chai.expect;

const C = require('../lib/constants');
const Processor = require('../lib/abstractor');
const logger = require('../lib/utils').logger;
const samples = require('./samples');
const ast_gen = Processor.ast_gen;

const COMM = C.COMM;
const CODE = C.CODE;
const CHAR = C.CHAR;
const DEF = C.DEF;
const MEMB = C.MEMB;
const NA = C.NA;

/**
 * Utility log namespaced helper
 */
const log = logger('spec');
const helpers = require('./test_helper');
const setup = helpers.setup;

//////////////////////////////////////////////////////////////////////

describe('Structures', async () => {
    let ast;
  
    before(async () => {
      ast = await ast_gen(setup(samples.STRUCT).input);
    });

  it('should handle inner members', async () => {
    const lookup = ast.index[5];
    // const def_node = ast.node(3);
    const comm_node = ast.node(5);
    const inner_node = ast.node(7);

    expect(lookup.type).to.equal('comments');
    expect(inner_node.assocs).to.have.property('comments');
    expect(inner_node.assocs.comments[0]).to.equal(comm_node.id);
  });
});