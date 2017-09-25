/**
 * @fileOverview
 * Tests for Transformation and AST generation
 *
 * @name transform.spec.js
 * @author Bailey Cosier <bailey@cosier.ca
 * @license MIT
 */


import {expect} from 'chai';
import {gen_ast} from '../src/processor';
import readline from 'readline';
import fs from 'fs';

// import { describe, before, it } from 'mocha';
import assert from 'assert';

import {Readable} from 'stream';
import streamBuffers from 'stream-buffers';

import {logger} from '../src/utils';
import samples from './samples';

/**
 * Utility log namespaced helper
 */
const log = logger('spec');

/**
* Sets up a streaming buffer reader for test harnessing
* @return {Buffer, Reader}
*/
function setup() {
    const buffer = new streamBuffers.ReadableStreamBuffer({
	      frequency: 10,   // in milliseconds.
	      chunkSize: 32 * 2048  // in bytes.
    });

    const input = readline.createInterface({
        input: buffer, terminal: false });

    return {buffer, input}
}

// Transformation Tests
describe('AST Streaming', () => {
    it('should accept a streaming buffer', async () => {
        const stream = setup()
        stream.buffer.stop();

        let ast = await gen_ast(stream.input);
        expect(ast).to.have.property('index')
        expect(ast).to.have.property('comments')
        expect(ast).to.have.property('code')
        expect(ast).to.have.property('source')
    });

});

describe('AST Functions', () => {
    it('handle function code points', async () => {
        const stream = setup()

        stream.buffer.put(samples.FUNCTION);
        stream.buffer.stop();

        let ast = await gen_ast(stream.input);
        console.log(ast.code);

        expect(ast.comments.present().length).to.equal(1)
        expect(ast.code.present().length).to.equal(1)
        log.hi(ast.index);
        expect(ast.index[7]).to.equal(1)
    });

    // it('handle comment entries on struct', async () => {
    //     const stream = setup()

    //     stream.buffer.put(samples.STRUCT);
    //     stream.buffer.stop();

    //     let ast = await gen_ast(stream.input);
    //     console.log(ast);

    //     expect(ast.comments.present().length).to.equal(1)
    // });

});
