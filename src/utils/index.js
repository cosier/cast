const logger = (name)=> {
  return (obj)=> {
    console.log(name, obj)
  }
}

export {logger}
