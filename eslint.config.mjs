import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      'out/**',
      'releases/**',
      'node_modules/**',
      'archive/**',
      'test-workspace/**',
      'test/fixtures/**',
      'vendors/**',
      '.agent/**',
      '.agents/**',
      '.forge/**',
      '.gemini/**',
      '.github/**',
      'openspec/**',
      '**/*.js',
    ],
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
);
