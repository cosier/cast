/**
 * @fileOverview
 * Orchestrates the processing of an input file.
 * From AST generation to final String product.
 *
 * @name processor.js
 * @author Bailey Cosier <bailey@cosier.ca>
 * @license MIT
 */


import fs from 'fs';
import {logger} from './utils';
import {resolve} from 'path';
import {writeFileSync as write, existsSync as exists} from 'fs';
import readline from 'readline';

/**
 * Utility log helper
 */
const log = logger('processor');

/**
 * Parses input file path and returns string result.
 * @return String
 */
async function process(ipath) {
    const ast = await gen_ast(ipath);
    return `<process::success::${ast.source.length}>`;
}

/**
  * Generate an Abstract Syntax Tree from source file
  * @return object
  */
function gen_ast(ipath) {
    const compute = new Promise((resolve, reject)=>{
        log("Async AST Generation");
        let ast = {
            source: [],
            comments: [],
            code: []
        }

        const finish = (result,) => {
            if (result) {
                resolve(result)
            } else {
                reject("could not finish")
            }
        }

        let reader = readline.createInterface({
            input: fs.createReadStream(ipath),
            terminal: false,
            console: false
        });

        let processed_line_yet = false;
        reader.on('line', (line) => {
            if (!processed_line_yet) {
                log("processing lines");
                processed_line_yet = true;
            }
            ast.source.push(line);
        });

        reader.on('close', (fin) => {
            finish(ast);
        });
    })

    return compute;
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
async function doctor(input, output) {
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

    const result = await process(ipath);

    if (stdout) {
        console.log("[doctor] processed: " + result);
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
