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
    log.colour = (colour, line) => {
        const clr = COLOURS[colour];
        const start = `\u001b[${clr}m`;
        const end = '\u001b[0m';
        if ( typeof line == "string" ) {
            console.log(`${id} ${start}${line}${end}`);
        } else {
            console.log(`${id} ${start}`);
            console.log(line);
            console.log(end);
        }
    }

    // Highlight helper
    log.hi = (line) => {
        log.colour('green', line);
    }

    return log;
}

export {logger}
