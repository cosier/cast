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

const Processor = require('../src/processor');
const logger = require('../src/utils').logger;
const samples = require('./samples');
const ast_gen = Processor.ast_gen;

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
const C = require('../src/constants');

//////////////////////////////////////////////////////////////////////

describe('Exotic Enums', async () => {
    let ast;

    before(async () => {
        ast = await ast_gen(setup(samples.FUNC).input);
    });

    it('should transform functions into `code` nodes', async () => {
        log('DEF', ast[DEF]);
        // log('CODE', ast[CODE]);

        expect(ast.index[3].type).to.equal(C.CODE);
        expect(ast.index[4].type).to.equal(C.CODE);

        expect(ast.keys(COMM).length).to.equal(1);
        expect(ast.keys(CODE).length).to.equal(1);
    });

});