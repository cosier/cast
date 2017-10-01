/**
 * @fileOverview
 * Debug Table
 * Used for one off test examination
 *
 * @name debug.spec.js
 * @author Bailey Cosier <bailey@cosier.ca
 * @license MIT
 */

const chai = require('chai')
const expect = chai.expect;

const Processor = require('../src/processor');
const logger = require('../src/utils').logger;
const samples = require('./samples');
const gen_ast = Processor.gen_ast;

const COMM = Processor.COMM;
const CODE = Processor.CODE;
const CHAR = Processor.CHAR;
const DEF = Processor.DEF;
const MEMB = Processor.MEMB;
const NA = Processor.NA;

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
        ast = await gen_ast(setup(samples.ENUMS_SINGLE_LINE).input);
    })

    it('should recognize single-line enum members', async () => {
        log.h1(ast)
        expect(ast.count(DEF)).to.deep.equal({[DEF]: 2})
        expect(ast.count(COMM)).to.deep.equal({[COMM]: 2})
        expect(ast.inner(9, MEMB).length).to.equal(5)
        expect(ast.inner(14, COMM).length).to.equal(1)
    })

});