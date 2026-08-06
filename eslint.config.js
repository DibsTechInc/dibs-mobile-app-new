// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'legacy-reference/*', 'ios/*', 'android/*', '.expo/*'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // `@studio/hero` is resolved by Metro at bundle time from the current studio's studio.json
      // (see metro.config.js), so no static resolver can find it — the file it points at depends
      // on STUDIO_SLUG. Scoped to that one specifier rather than disabling the rule: an actual
      // broken import elsewhere must still fail, and a missing hero is caught by the white-label
      // test suite and by the bundler itself.
      'import/no-unresolved': ['error', { ignore: ['^@studio/'] }],
      // legacy-reference/ is read-only history (MOBILE_MASTER_PLAN §0 item 4): a source to port
      // business logic FROM, never something the running app links against.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/legacy-reference/**'],
              message:
                'legacy-reference/ is read-only reference for porting logic. Never import from it at runtime.',
            },
          ],
        },
      ],
    },
  },
]);
