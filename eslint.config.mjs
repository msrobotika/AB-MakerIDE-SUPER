import globals from 'globals';

export default [{
  ignores: ['node_modules/**', '.makeride-data/**'],
}, {
  files: ['*.js', 'frontend/*.js'],
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    globals: {...globals.browser, ...globals.commonjs, BoardTrials: 'readonly', RobotActivity: 'readonly'},
  },
  rules: {
    'no-undef': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-restricted-globals': ['error', {name: 'confirm', message: 'Use the asynchronous in-page confirmation.'}, {name: 'prompt', message: 'Use an in-page form.'}],
    'no-restricted-properties': ['error',
      {property: 'innerHTML', message: 'Use DOM nodes and textContent.'},
      {property: 'outerHTML', message: 'Use DOM nodes and textContent.'},
      {object: 'document', property: 'write', message: 'Do not parse dynamic HTML.'},
    ],
    'no-unreachable': 'error',
    'no-constant-condition': ['error', {checkLoops: false}],
    'no-dupe-keys': 'error',
    'no-unused-vars': ['error', {args: 'none', caughtErrors: 'none'}],
  },
}];
