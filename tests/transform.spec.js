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

import SAMPLES from './samples';

// Transformation Tests
describe('AST Streaming', () => {
    it('should accept a streaming buffer', async () => {
        let buffer = new streamBuffers.ReadableStreamBuffer({
	          frequency: 10,   // in milliseconds.
	          chunkSize: 32 * 2048  // in bytes.
        });

        const reader = readline.createInterface({ input: buffer, terminal: false });

        buffer.put(SAMPLES.s1);
        buffer.stop();

        let ast = await gen_ast(reader);
        expect(ast).to.have.property('index')
        expect(ast).to.have.property('comments')
        expect(ast).to.have.property('code')
        expect(ast).to.have.property('source')
    });

});
