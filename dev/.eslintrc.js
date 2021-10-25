module.exports = {
  env: {
    browser: true,
    es2020: true,
    jest: true
  },
  extends: [
    'standard'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020
  },
  plugins: [
    '@typescript-eslint'
  ],
  rules: {
    "indent": ["error", 4],
    "camelcase": "warn",
    "no-unused-vars": "warn",
    "brace-style": [ "warn", "1tbs", {"allowSingleLine": false } ]
  }
}
