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
function setup(sample) {
  const buffer = new streamBuffers.ReadableStreamBuffer({
    frequency: 10,   // in milliseconds.
    chunkSize: 32 * 2048  // in bytes.
  });

  const input = readline.createInterface({
    input: buffer, terminal: false });

  buffer.put(sample || "");
  buffer.stop();

  return {buffer, input}
}

/**
 * Transformation Tests
 */
describe('AST Streaming', async () => {

  it('should accept a streaming buffer', async () => {
    let ast = await gen_ast(setup().input);

    expect(ast).to.have.property('index')
    expect(ast).to.have.property('comments')
    expect(ast).to.have.property('code')
    expect(ast).to.have.property('source')
  });

});

describe('AST Functions', async () => {
  let ast;

  before(async () => {
    ast = await gen_ast(setup(samples.FUNC).input);
  })

  it('should handle function code points', async() => {
    expect(ast.comments.present().length).to.equal(1);
    expect(ast.code.present().length).to.equal(1);
  });

  it('should have valid indexes', async () => {
    expect(ast.index.length).to.equal(ast.source.length);
    expect(ast.index[7].node_id).to.equal(3);
  });

  // Should backtrace the previous def into a code point,
  // This happens due to CHAR(s) on lines before a code point.
  it('should handle back tracing transforms', async () => {
    expect(ast.index[3].type).to.equal("code");
  });

});

describe('AST Structures', async () => {
  let ast;

  before(async () => {
    ast = await gen_ast(setup(samples.STRUCT).input);
  })

  it('should handle function structs', async() => {
    expect(ast.comments.present().length).to.equal(2);
  });

  it('should associate comments to def members', async() => {
    // log.hi(ast);
    const comm_node = ast.node(0);
    const def_node = ast.node(3);

    expect(comm_node.assocs).to.have.property('defs');
    expect(def_node.assocs).to.have.property('comments');

    expect(comm_node.assocs.defs[0]).to.equal(def_node.id);
    expect(def_node.assocs.comments[0]).to.equal(comm_node.id);
  });

});
