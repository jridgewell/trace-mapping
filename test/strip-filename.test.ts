import stripFilename from '../src/strip-filename';
import { test, describe } from './setup';

describe('stripFilename', () => {
  test('returns empty string for empty string', (t) => {
    t.is(stripFilename(''), '');
  });

  test('returns empty string if no directory', (t) => {
    t.is(stripFilename('foo'), '');
  });

  test('it trims filename from directory path', (t) => {
    t.is(stripFilename('/foo/bar/baz'), '/foo/bar/');
    t.is(stripFilename('/foo/bar'), '/foo/');
  });

  test('it does nothing if trailing slash', (t) => {
    t.is(stripFilename('/foo/bar/baz/'), '/foo/bar/baz/');
    t.is(stripFilename('/foo/bar/'), '/foo/bar/');
    t.is(stripFilename('/foo/'), '/foo/');
    t.is(stripFilename('/'), '/');
  });
});
