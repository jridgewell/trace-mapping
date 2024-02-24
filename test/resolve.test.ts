import { strict as assert } from 'assert';
import resolve from '../src/resolve';

describe('resolve', () => {
  it('resolves input relative to base', () => {
    const base = 'bar/';
    const input = 'foo';

    assert.equal(resolve(input, base), 'bar/foo');
  });

  it('treats base as a directory regardless of slash', () => {
    const base = 'bar';
    const input = 'foo';

    assert.equal(resolve(input, base), 'bar/foo');
  });
});
