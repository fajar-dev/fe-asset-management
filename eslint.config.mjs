// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    'vue/no-multiple-template-root': 'off',
    'vue/max-attributes-per-line': ['error', { singleline: 3 }],
    '@typescript-eslint/no-unused-vars': ['warn', { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
    '@typescript-eslint/no-explicit-any': "off"
  }
})
