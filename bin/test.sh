#!/bin/bash
BIN="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT=$( cd $BIN/../ && pwd )

$(npm bin)/mocha-webpack \
  --webpack-config $ROOT/build/webpack.config.test.js \
  --watch --glob '*.spec.js' tests
