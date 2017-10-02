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

const C = require('../src/constants');
const Processor = require('../src/processor');
const logger = require('../src/utils').logger;
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

describe('Exotic Enums', async () => {
    let ast;

    before(async () => {
        ast = await ast_gen(setup(samples.ENUMS_SINGLE_LINE).input);
    })

    it('should recognize single-line enum members', async () => {
        expect(ast.count(DEF)).to.deep.equal({[DEF]: 2})
        expect(ast.count(COMM)).to.deep.equal({[COMM]: 2})
        expect(ast.inner(9, MEMB).length).to.equal(5)
        expect(ast.inner(14, COMM).length).to.equal(1)
    })

});