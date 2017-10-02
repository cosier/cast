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

function colorize(colour, ...items) {
  const clr = COLOURS[colour];
  const start = `\u001b[${clr}m`;
  const end = '\u001b[0m';
  const id = this.id || '';

  console.log(`${id}${start}`);

  for (let item of items) {
    if (item === undefined) item = 'undefined';
    console.log(util.inspect(item, { depth: 10, colors: true }));
  }

  console.log(end);
}

function hilighter(colour) {
  return (...items) => {
    colorize(colour, ...items);
  }
}

function create_base_logger(id) {
  let base = (...items)=> {
    let opts = [
      'blue', ...items
    ];
    colorize.apply({ id }, opts);
  };

  // Wraps errs in bright red
  base.error = hilighter('red');

  // Custom colour wrapper unlimited arg support
  base.colour = colorize;

  base.grn = hilighter('green');
  base.yell = hilighter('yellow');
  base.blue = hilighter('blue');
  base.cyan = hilighter('cyan');
  base.pink = hilighter('pink');

  // Highlight helper
  base.h1 = base.grn;
  base.h2 = base.cyan;

  return base;
}

/**
 * Build a beautiful logging wrapper.
 * Supports formatting and coloured output
 *
 * @param {name} Prefixed namespace for the log output
 * @return {function} wrapped logging functor
 */
const logger = (name)=> {
  return create_base_logger(`[${name}] `);
}

module.exports = { logger: logger }
