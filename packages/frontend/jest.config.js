/**
 * Native ESM Jest config (interpreted as ESM under package "type": "module").
 *
 * ts-jest transforms .ts/.tsx in ESM mode using tsconfig.jest.json. Run via
 * `cross-env NODE_OPTIONS=--experimental-vm-modules jest` (see package.json).
 */
export default {
  // jest-fixed-jsdom: superset of jsdom that restores Node globals jsdom clobbers
  // (TextEncoder/TextDecoder etc.), which react-router-dom v7 needs at import time.
  testEnvironment: 'jest-fixed-jsdom',
  setupFilesAfterEnv: ['./jest.setup.ts'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  // Resolve `.js` specifiers emitted/authored under ESM back to their TS source.
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.jest.json',
      },
    ],
  },
  // antd (and its ESM-only transitive deps) ship ESM that must be transformed.
  transformIgnorePatterns: [
    'node_modules/(?!(?:antd|@ant-design|rc-[^/]+|@rc-component)/)',
  ],
  
}
