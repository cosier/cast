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

describe('Debugging', async () => {
    let ast;

    before(async () => {
        ast = await gen_ast(setup(samples.ENUMS).input);
    })

    it('should recognize multi-line documentation', async () => {
        log.cyan(ast);
        expect(ast.count(DEF)).to.deep.equal({ [DEF]: 2 })
        expect(ast.count(COMM)).to.deep.equal({ [COMM]: 5 })
        expect(ast.count(CODE)).to.deep.equal({ [CODE]: 0 })
    })

});