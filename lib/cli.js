const yargs = require('yargs/yargs');
const logger = require('./utils').logger;

const ast_from_file = require('./abstractor').ast_from_file;
const annotate_file = require('./annotator').annotate_file;

/**
 * CLI Log helper
 */
const log = logger('cast.cli');

let executed = false;

/**
 * Indicate to node process that we wish to stop.
 * Flush stdout and stop the process.
 */
function stop(code = 1) {
    process.exitCode = code
}

/*
 * Execute command line switches
 * Will exit process upon completion or failure.
 */
function exec() {
    const parser = yargs()
        .usage('$0 <cmd> [args]')
          .command('transform <input>',
                   'transform input into an AST json',
                   ...transform_command())

          .command('annotate  <input> [--range]',
                   'annotate input with node metadata',
                   ...annotate_command())
        .help()

    // Parse the cli arguments and execute commands.
    const parsed = parser.parse(args());

    // Detect no commands were executed and bring up the help.
    if (!executed) {
        if (args().length > 0) {
            log.error("Sorry, we couldn't recognize your arguments", args(), "\n")
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
            let process = ast_from_file(argv.input)
                .then((result) => {
                    if (result && result.code) {
                        console.log(result.json());
                    } else {
                        stop();
                    }

                })
                .catch((err) => {
                    log.error(
                        "Failed to process your input", err);
                    stop();
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
                "\nFile <input> needs to be specified\n")
        } else {
            annotate_file(argv.input, argv.range);
        }
    }];
}

/**
 * Examine process args and strip away any shell scruff
 * @return Array containing argv
 */
function args() {
    let args = process.argv
    if (!args.length) { return args }

    // Clean initial parameter which is the executable itself.
    if (args[0] && args[0].indexOf("node") >= 0) {
        args.shift()
    }

    // Clean any executable javascript argument
    if (args[0] && args[0].indexOf(".js") >= 0) {
        args.shift()
    }

    // Clean double stdin redirection
    if (args[0] && args[0] === "--") {
        args.shift()
    }

    // Clean double stdin redirection
    if (args[0] && args[0].indexOf("c-ast") >=0) {
        args.shift()
    }

    return args
}

/**
 * Expose exec api
 */
module.exports = { exec };
