import yargs from 'yargs/yargs';
import { logger } from './utils';

import { ast_from_file } from './abstractor';
import { annotate_file } from './annotator';

/** 
 * CLI Log helper
 */
const log = logger('cast.cli');

/**
 * Indicate to node process that we wish to stop.
 * Flush stdout and stop the process.
 */
function stop_gracefully(code) {
    process.exitCode = code
}

/*
 * Execute command line switches
 * Will exit process upon completion or failure.
 */
function exec() {
    let executed = false;
    transform = transform_command();
    annotate = annotate_command();

    const parser = yargs()
        .usage('$0 <cmd> [args]')
        .command('transform [input]', 'transform input into an AST',
        transform[0], transform[1])

        .command('annotate [input]', 'annotate input with node types',
        annotate[0], annotate[1])
        .help()

    // Parse the cli arguments and execute commands.
    const parsed = parser.parse(args());

    // Detect no commands were executed and bring up the help.
    if (!executed) {
        if (args().length > 0) {
            log.error("Sorry, we couldn't recoginize your arguments", args(), "\n")
        }

        parser.help().parse(["--help"])
    }
}

function transform_command() {
    return [{
        name: {
            default: 'transform',
            describe: 'file you wish to extract docs from'
        }
    }, (argv) => {
        executed = true;
        if (!argv.input) {
            console.error(
                "\nFile [input] needs to be specified\n")
        } else {
            let ret = 1;
            let process = ast_from_file(argv.input)
                .then((result) => {
                    if (result && result.code) { ret = 0; }
                    stop_gracefully(ret);
                })
                .catch((err) => {
                    log.error(
                        "Failed to process your input", err);
                    stop_gracefully(1);
                });

            return;
        }
    }];
}

function annotate_command() {
    return [{
        name: {
            default: 'annotate',
            describe: 'file you wish to annotate'
        }
    }, (argv) => {
        executed = true;
        if (!argv.input) {
            console.error(
                "\nFile [input] needs to be specified\n")
        } else {
            let ret = 1;
            let process = annotate_file(argv.input)
                .then((result) => {
                    if (result && result.code) { ret = 0; }
                    stop_gracefully(ret);
                })
                .catch((err) => {
                    log.error(
                        "Failed to process your input", err);
                    stop_gracefully(1);
                });

            return;
        }
    }];
}

/**
 * Examine process args and strip away any shell scruff
 * @return Array containing argv
 */
function args() {
    let args = process.argv

    // Clean initial parameter which is the executable itself.
    if (args[0].indexOf("node") >= 0) {
        args.shift()
    }

    // Clean any executable javascript argument
    if (args[0].indexOf(".js") >= 0) {
        args.shift()
    }

    // Clean double stdin redirection
    if (args[0] === "--") {
        args.shift()
    }

    return args
}

/**
 * Expose exec api
 */
export { exec };

