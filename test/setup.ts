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

function getLabel(label: string): string {
  context.push(label);
  label = context.join(' - ');
  context.pop();
  return label;
}

// Copying type from node_modules/ava/types/test-fn.d.ts
const test = function test<Args extends unknown[]>(
  label: string,
  fn: Implementation<Args>,
  ...args: Args
): void {
  ava(getLabel(label), fn, ...args);
};

test.macro = ava.macro;
test['only'] = <Args extends unknown[]>(label: string, fn: Implementation<Args>, ...args: Args) => {
  ava.only(getLabel(label), fn, ...args);
};
test.skip = function skip<Args extends unknown[]>(
  label: string,
  fn: Implementation<Args>,
  ...args: Args
): void {
  ava.skip(getLabel(label), fn, ...args);
};

export { test, describe, describe as context };
