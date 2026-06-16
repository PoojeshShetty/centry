import type { StackFrame } from '../types.js';
import { SDK_NAME } from './constants.js';

const FRAME_WITH_FN = /^\s+at\s+(.+?)\s+\((.+?)(?::(\d+))?(?::(\d+))?\)$/;
const FRAME_WITHOUT_FN = /^\s+at\s+((?!.*\().+?)(?::(\d+))?(?::(\d+))?$/;

export function parseStack(stack: string): StackFrame[] {
  if (!stack) return [];

  const frames: StackFrame[] = [];

  for (const line of stack.split('\n')) {
    const withFn = FRAME_WITH_FN.exec(line);
    if (withFn) {
      const [, fn, filename, lineno, colno] = withFn;
      if (filename.includes(SDK_NAME)) continue;
      const frame: StackFrame = { filename, function: fn };
      if (lineno !== undefined) frame.lineno = Number(lineno);
      if (colno !== undefined) frame.colno = Number(colno);
      frames.push(frame);
      continue;
    }

    const withoutFn = FRAME_WITHOUT_FN.exec(line);
    if (withoutFn) {
      const [, filename, lineno, colno] = withoutFn;
      if (filename.includes(SDK_NAME)) continue;
      if (filename.startsWith('node:')) continue;
      const frame: StackFrame = { filename, function: '<anonymous>' };
      if (lineno !== undefined) frame.lineno = Number(lineno);
      if (colno !== undefined) frame.colno = Number(colno);
      frames.push(frame);
    }
  }

  return frames;
}
