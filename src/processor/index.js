import {logger} from '../utils';
const log = logger('process_docs');

verifyInput(input) {
    console.error("invalid input");
    return false;
}

const doctor = (input, output)=> {
    log(`input: ${input}, output: ${output}`)
    const cwd = process.cwd();
    debugger;

    if (!verifyInput(input)) {
        return;
    }
    log(`cwd: ${cwd}`);
}

export {doctor}
