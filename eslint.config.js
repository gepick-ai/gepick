import antfu from '@antfu/eslint-config';

export default antfu(
  {
    markdown: false,
    stylistic: {
      semi: true,
    },
  },
  {
    // 针对全局的指定（文件夹/文件）进行忽略
    ignores: ['**/dist', "**/lib",],
  },
  {
    rules: {
      'eslint-comments/no-unlimited-disable': 'off',
      'vue/html-self-closing': 'off',
      'style/quotes': 'off',
      'ts/no-redeclare': 'off',
      'vue/custom-event-name-casing': 'off',
      'node/prefer-global/process': 'off',
      'ts/consistent-type-imports': 'off',
      'antfu/top-level-function': 'off',
      'jsdoc/require-returns-check': 'off',
      'jsdoc/check-param-names': 'off',
      'jsdoc/require-returns-description': 'off',
      'unicorn/prefer-node-protocol': 'off',
      'ts/no-namespace': 'off',
      'ts/ban-ts-comment': 'off',
      'unicorn/no-new-array': 'off',
      'dot-notation':'off'
    },
  },
);
