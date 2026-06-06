import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    files: ['packages/**/src/**/*.ts'],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
  },
  {
    ignores: ['packages/**/dist/**'],
  },
);
