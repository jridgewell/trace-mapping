import { strict as assert } from 'assert';
import stripFilename from '../src/strip-filename';

describe('stripFilename', () => {
  it('returns empty string for empty string', () => {
    assert.equal(stripFilename(''), '');
  });

  it('returns empty string if no directory', () => {
    assert.equal(stripFilename('foo'), '');
  });

  it('it trims filename from directory path', () => {
    assert.equal(stripFilename('/foo/bar/baz'), '/foo/bar/');
    assert.equal(stripFilename('/foo/bar'), '/foo/');
  });

  it('it does nothing if trailing slash', () => {
    assert.equal(stripFilename('/foo/bar/baz/'), '/foo/bar/baz/');
    assert.equal(stripFilename('/foo/bar/'), '/foo/bar/');
    assert.equal(stripFilename('/foo/'), '/foo/');
    assert.equal(stripFilename('/'), '/');
  });
});
