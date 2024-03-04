import { strict as assert } from 'assert';
import resolver from '../src/resolve';

describe('resolve', () => {
  it('unresolved without sourceRoot', () => {
    const resolve = resolver(undefined, undefined);
    assert.equal(resolve('input.js'), 'input.js');
  });

  it('relative to mapUrl', () => {
    const resolve = resolver('foo/script.js.map', undefined);
    assert.equal(resolve('input.js'), 'foo/input.js');
  });

  it('relative to sourceRoot', () => {
    const resolve = resolver(undefined, 'foo');
    assert.equal(resolve('input.js'), 'foo/input.js');
  });

  it('relative to mapUrl then sourceRoot', () => {
    const resolve = resolver('foo/script.js.map', 'bar');
    assert.equal(resolve('input.js'), 'foo/bar/input.js');
  });

  it('prepends sourceRoot to source before resolving', () => {
    const resolve = resolver('foo/script.js.map', 'bar');
    assert.equal(resolve('/input.js'), 'foo/bar/input.js');
  });

  it('skips undefined sourceRoot before resolving', () => {
    const resolve = resolver('foo/script.js.map', undefined);
    assert.equal(resolve('/input.js'), '/input.js');
  });
});
