/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Allow longer subject lines for detailed commits
    'subject-max-length': [1, 'always', 120],
    // Allow multiline body
    'body-max-line-length': [0, 'always', Infinity],
  },
};
