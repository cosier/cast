module.exports = {
  "extends": ["eslint:recommended", "google"],
  "parser": "babel-eslint",
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true,
      "modules": true
    }
  },
  "rules": {
    "camelcase": 0,
    "no-console": 0,
    "brace-style": "stroustrup"
  },
  "globals": {
    "require": true,
    "Promise": true,
    "process": true,
    "console": true,
    "module": true
  }
};
