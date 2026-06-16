import { describe, it, expect } from 'vitest';
import { parseStack } from '../stackTrace.js';

const SDK_NAME = '@centry/sdk-react';

const V8_STACK = `Error: test
    at Object.<anonymous> (/home/user/app/src/service.ts:10:5)
    at Module._compile (node:internal/modules/cjs/loader:1364:14)
    at Object.<anonymous> (/home/user/app/node_modules/${SDK_NAME}/src/captureLog.ts:42:3)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)`;

describe('parseStack', () => {
  it('parses a standard V8 stack into StackFrame objects', () => {
    const frames = parseStack(V8_STACK);
    expect(frames.length).toBeGreaterThan(0);
    expect(frames[0]).toMatchObject({
      filename: '/home/user/app/src/service.ts',
      function: 'Object.<anonymous>',
      lineno: 10,
      colno: 5,
    });
  });

  it('strips frames whose filename contains @centry/sdk-react', () => {
    const frames = parseStack(V8_STACK);
    const internal = frames.filter((f) => f.filename.includes(SDK_NAME));
    expect(internal).toHaveLength(0);
  });

  it('includes non-SDK node_modules frames', () => {
    const stack = `Error
    at fn (/app/node_modules/express/lib/router.js:5:3)`;
    const frames = parseStack(stack);
    expect(frames).toHaveLength(1);
    expect(frames[0].filename).toBe('/app/node_modules/express/lib/router.js');
  });

  it('returns [] for an empty string', () => {
    expect(parseStack('')).toEqual([]);
  });

  it('returns [] for a malformed / unparseable stack', () => {
    expect(parseStack('not a real stack trace')).toEqual([]);
  });

  it('omits lineno and colno when not present', () => {
    const stack = `Error
    at anonymous (<anonymous>)`;
    const frames = parseStack(stack);
    expect(frames).toHaveLength(1);
    expect(frames[0].lineno).toBeUndefined();
    expect(frames[0].colno).toBeUndefined();
  });

  it('parses anonymous function frames', () => {
    const stack = `Error
    at /home/user/app/src/index.ts:5:10`;
    const frames = parseStack(stack);
    expect(frames).toHaveLength(1);
    expect(frames[0]).toMatchObject({
      filename: '/home/user/app/src/index.ts',
      lineno: 5,
      colno: 10,
    });
  });
});
