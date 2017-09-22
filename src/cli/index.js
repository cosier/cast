import yargs from 'yargs/yargs';
import debug from 'debug'

import {doctor} from '../processor';

// Examine process args and strip away any shell scruff
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

  return args
}


// Execute command line switches
function exec() {
    const parser = yargs()
          .usage('$0 <cmd> [args]')
          .command(
              'transform [input] [output]',
              'transform input docs into output destination', {
                  name: {
                      default: 'transform',
                      describe: 'file you wish to extract docs from'
                  }
              }, (argv) => {
                  if (!argv.input) {
                      console.error(
                          "\nFile [input] needs to be specified\n")
                  } else {
                      let ret = 1;
                      if (doctor(argv.input, argv.output)) {
                          ret = 0;
                      }

                      process.exit(ret)
                  }
              })

    const parsed = parser.parse(args());

    // Show help screen if nothing else..
    parser.help().parse(["--help"])
}

export {exec};

