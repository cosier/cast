const util = require('util');

/**
 * Colours lookup table
 */
const COLOURS = {
  red: 31,
  // yellow: 93,
  yellow: 33,
  green: 32,
  blue: 34,
  pink: 35,
  cyan: 36
}

/**
 * Build a beautiful logging wrapper.
 * Supports formatting and coloured output
 *
 * @param {name} Prefixed namespace for the log output
 * @return {function} wrapped logging functor
 */
const logger = (name)=> {
  let id = `[${name}]`;
  let log = (...items)=> {
    console.log(id, ...items)
  };

  // Wraps errs in bright red
  log.error = (...errs) => {
    const start = `\u001b[${COLOURS['red']}m`;
    const end = '\u001b[0m';
    console.error(`${start}${id}`, ...errs, end)
  };

  // Custom colour wrapper unlimited arg support
  log.colour = (colour, ...items) => {
    const clr = COLOURS[colour];
    const start = `\u001b[${clr}m`;
    const end = '\u001b[0m';

    console.log(`${id} ${start}`);

    for (let item of items) {
      if (item === undefined) item = 'undefined';
      console.log(util.inspect(item, { depth: 10 }));
    }

    console.log(end);
  }

  log.grn = (...line) => {
    log.colour('green', ...line);
  }

  log.yell = (...line) => {
    log.colour('yellow', ...line);
  }

  log.blue = (...line) => {
    log.colour('blue', ...line);
  }

  log.cyan = (...line) => {
    log.colour('cyan', ...line);
  }

  log.pink = (...line) => {
    log.colour('pink', ...line);
  }

  // Highlight helper
  log.h1 = log.grn;
  log.h2 = log.cyan;

  return log;
}

module.exports = { logger: logger }
