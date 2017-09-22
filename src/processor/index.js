import {logger} from '../utils';
import {writeFileSync as write, existsSync as exists} from 'fs';
import {resolve} from 'path';

const log = logger('processor:');

/**
 * Parses input file path and returns string result.
 * @return String
 */
function parse(ipath) {
    return "<parse::success>";
}

/**
 * Writes contents to a file
 * @return Boolean
 */
function printf(opath, contents) {
    try {
        write(opath, contents)
    } catch(e) {
        console.log("Failed to write file")
        return false;
    }

    log(`output -> ${opath}`)
    return true
}

/**
 *  Handles input into output.
 *  If output is not provided, stdout is used.
 *
 * @return Boolean
**/
function doctor(input, output) {
    log(`doctor(input: ${input}, output: ${output})`)
    let opath = null;
    let stdout = false;
    let success = false;

    const ipath = resolve(input);

    if (output) {
        opath = resolve(output);
    } else {
        stdout = true;
    }

    if (!exists(ipath)) {
        console.error(`Invalid input file: ${input}`);
        return false;
    }

    const result = parse(ipath);

    if (stdout) {
        console.log("\n" + result);
        success = true;
    } else if (result) {
        success = printf(opath, result)
    }

    return success;
}

/**
 * Expose doctor interface
 */
export {doctor}
