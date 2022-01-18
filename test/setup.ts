import ava from 'ava';
import type { Implementation } from 'ava';

const context: string[] = [];

function describe(label: string, fn: () => void): void {
  try {
    context.push(label);
    fn();
  } finally {
    context.pop();
  }
}

// Copying type from node_modules/ava/types/test-fn.d.ts
const test = function test<Args extends unknown[]>(
  label: string,
  fn: Implementation<Args>,
  ...args: unknown[]
): void {
  context.push(label);
  label = context.join(' - ');
  context.pop();
  ava(label, fn as any, ...args);
};

test.macro = ava.macro;

export { test, describe, describe as context };
