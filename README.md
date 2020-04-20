# c-ast

Generates an **Abstract Syntax Tree** from C source code.

The resulting AST provides in-depth structured access and **meta data** to all definitions inside the given input.


## Features

####1. Comments **Extraction** and **Association** Lookup
c-ast extracts all comments in the source code as their own nodes, along with intelligent node association. This allows easy lookup of code that belongs to a comment, or getting any comments that belong to a given code block via an abritrary line lookup.

####2. **Indexed access** to all structured nodes in the source input
An index is provided for fast lookup of any line, returning the node that spans that line along with node meta data.

####3. Use a **CLI tool** or **JavaScript** *api* for generating ASTs
   Use the `$ c-ast` cli to output JSON, or use the API directly in your **NodeJS** application with `require('c-ast')`


## Getting Started (CLI)

Use NPM to install the c-ast library and accompanying cli executable.

```bash
$ npm install c-ast
$ c-ast --help

c-ast <cmd> [args]

Commands:
  transform <input> [--range]               transform input into an AST json
  annotate  <input> [--range] [--colorize]  annotate input with node metadata

Options:
  --version  Show version number                                       
  --help     Show help     
  
$ c-ast transform specimen/sample.h                                            

```

The **transform** command will output a JSON representation from the given input.

The **annotate** command will output the original input with added metadata on the side— used mainly for AST analysis and inspection.

An optional range argument is also available for limiting the resulting output.

## Getting Started (Javascript API)
The Javascript APIs return a Promise which resolves into a AST data structure.

```javascript
const cast = require('c-ast');

// Parse text input directly
const ast = await cast.ast_from_text("code_text_input");

// Read a file from disk
const ast = await cast.ast_from_file(path_to_file);

// Takes a streaming buffer
const ast = await cast.ast_from_stream(buffer);

```

## Examples

In this basic example, the JSON output outlines the various functions, structures, and association of comments belonging to the struct and functions.

```
$ c-ast transform specimen/examples.c
```

```json
{
    "nodes": {
        "comments": {
            "0": {
                "id": 0,
                "type": "comments",
                "assocs": {},
                "data": {
                    "0": "// Display Prime Numbers Between two Intervals When Larger Number is Entered first",
                    "1": "// @filename example.c",
                    "2": "// @author Bailey C"
                }
            },
            "6": {
                "id": 6,
                "type": "comments",
                "assocs": {
                    "defs": [
                        7
                    ]
                },
                "data": {
                    "6": "// Structure for managing prime input boundaries"
                }
            },
            "12": {
                "id": 12,
                "type": "comments",
                "assocs": {
                    "code": [
                        13
                    ]
                },
                "data": {
                    "12": "// Main entry point"
                }
            },
            "24": {
                "id": 24,
                "type": "comments",
                "assocs": {
                    "code": [
                        27
                    ]
                },
                "data": {
                    "24": "/**",
                    "25": " * Determines primes within a boundary",
                    "26": " */"
                }
            }
        },
        "code": {
            "13": {
                "id": 13,
                "type": "code",
                "assocs": {
                    "comments": [
                        12
                    ]
                },
                "data": {
                    "13": "int main()",
                    "14": "{",
						...
                    "21": "    return determine_primes(input);",
                    "22": "}"
                }
            },
            "27": {
                "id": 27,
                "type": "code",
                "assocs": {
                    "comments": [
                        24
                    ]
                },
                "data": {
                    "27": "int determine_primes(prime_input input)",
                    "28": "{",
						...
                    "54": "}"
                }
            }
        },
        "defs": {
            "7": {
                "id": 7,
                "type": "defs",
                "assocs": {
                    "comments": [
                        6
                    ]
                },
                "data": {
                    "7": "typedef struct prime_input {",
                    "10": "} prime_input;"
                },
                "inner": [
                    {
                        "id": 8,
                        "type": "members",
                        "assocs": {},
                        "data": {
                            "8": "    int low;"
                        },
                        "parent": 7
                    },
                    {
                        "id": 9,
                        "type": "members",
                        "assocs": {},
                        "data": {
                            "9": "    int high;"
                        },
                        "parent": 7
                    }
                ],
                "index": {
                    "8": {
                        "ind": 0,
                        "type": "members"
                    },
                    "9": {
                        "ind": 1,
                        "type": "members"
                    }
                }
            }
        }
    },
    "index": {
        "0": {
            "node_id": 0,
            "type": "comments",
        },
        "1": {
            "node_id": 0,
            "type": "comments",
        },
        "2": {
            "node_id": 0,
            "type": "comments",
        }
        ...
        "54": {
            "node_id": 27,
            "type": "code",
        }
    }
}
```

## Testing

c-ast has full test coverage of all internal and public methods, including various edge case tests and real world specimen tests for completeness.

Tests are executed with **mocha** via the `npm test` command, and can be found in the */tests* folder.


## License

Authoried by Bailey Cosier.
Licensed under The MIT License (MIT)

For the full copyright and license information, please view the LICENSE file.

