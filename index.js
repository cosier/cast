const cli = require('./lib/cli');
const abstract = require('./lib/abstractor');

const ast_from_file = abstract.ast_from_file;
const ast_from_text = abstract.ast_from_text;
const ast_from_stream = abstract.ast_gen;

module.exports = {
  ast_from_file,
  ast_from_text,
  ast_from_stream,
  cli
}

