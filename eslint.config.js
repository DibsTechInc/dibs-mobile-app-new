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
