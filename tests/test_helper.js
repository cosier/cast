/**
 * @fileOverview
 * Test helper funcs
 * Items needed for test harness support.
 *
 * @name debug.spec.js
 * @author Bailey Cosier <bailey@cosier.ca
 * @license MIT
 */

const Readable = require('stream').Readable;
const readline = require('readline');

const streamBuffers = require('stream-buffers');

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
        input: buffer, terminal: false
    });

    buffer.put(sample || "");
    buffer.stop();

    return { buffer, input }
}

module.exports = {
    setup
}