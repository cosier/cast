const logger = (name)=> {
  let log = (...items)=> {
    console.log(`[${name}]`, ...items)
  };

    log.error = (...errs) => {
        console.error(`[${name}]`, ...errs)
    };

    return log;
}

export {logger}
