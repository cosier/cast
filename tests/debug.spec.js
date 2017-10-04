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

describe('Debugging', async () => {
    let ast;

    before(async () => {
        ast = await ast_gen(setup(samples.MACROS).input);
    })

    it('should recognize macros', async () => {
        expect(ast.count(COMM)).to.deep.equal({ [COMM]: 4 })
    })
});