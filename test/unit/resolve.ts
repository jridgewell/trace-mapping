import resolve from '../../src/resolve';
import { test, describe } from '../setup';

describe('resolve', () => {
  test('resolves input relative to base', (t) => {
    const base = 'bar/';
    const input = 'foo';

    t.is(resolve(input, base), 'bar/foo');
  });

  test('treats base as a directory regardless of slash', (t) => {
    const base = 'bar';
    const input = 'foo';

    t.is(resolve(input, base), 'bar/foo');
  });
});
