#!/usr/bin/env node
const cast = require('c-ast');
if (cast) {
  cast.cli.exec();
} else {
  console.error("c-ast library not found");
  console.error("try installing it with `npm i -g c-ast`")
}
