module.exports = {
  "extends": ["eslint:recommended", "google"],
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true,
      "modules": true
    }
  },
  "rules": {
    "camelcase": 0,
    "no-console": 0,
    "brace-style": ["error", "stroustrup"]
  },
  "globals": {
    "require": true,
    "Promise": true,
    "process": true,
    "console": true,
    "module": true
  }
};
