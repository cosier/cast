import util from 'util';


/**
 * Colours lookup table
 */
const COLOURS = {
  red: 31,
  yellow: 93,
  green: 32
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

  // Custom colour wrapper with line / object support
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

  // Highlight helper
  log.hi = (...line) => {
    log.colour('green', ...line);
  }

  return log;
}

export {logger}
