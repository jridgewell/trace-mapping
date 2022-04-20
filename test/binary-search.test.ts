import { binarySearch, found, memoizedState, memoizedBinarySearch } from '../src/binary-search';
import { test, describe } from './setup';

type SourceMapSegment = [number];

describe('binary search', () => {
  test('returns index of match', (t) => {
    const array: SourceMapSegment[] = [];

    array.push([0]);
    t.is(binarySearch(array, 0, 0, array.length - 1), 0);

    array.push([1]);
    t.is(binarySearch(array, 0, 0, array.length - 1), 0);
    t.is(binarySearch(array, 1, 0, array.length - 1), 1);

    array.push([2]);
    t.is(binarySearch(array, 0, 0, array.length - 1), 0);
    t.is(binarySearch(array, 1, 0, array.length - 1), 1);
    t.is(binarySearch(array, 2, 0, array.length - 1), 2);

    array.push([3]);
    t.is(binarySearch(array, 0, 0, array.length - 1), 0);
    t.is(binarySearch(array, 1, 0, array.length - 1), 1);
    t.is(binarySearch(array, 2, 0, array.length - 1), 2);
    t.is(binarySearch(array, 3, 0, array.length - 1), 3);

    array.push([4]);
    t.is(binarySearch(array, 0, 0, array.length - 1), 0);
    t.is(binarySearch(array, 1, 0, array.length - 1), 1);
    t.is(binarySearch(array, 2, 0, array.length - 1), 2);
    t.is(binarySearch(array, 3, 0, array.length - 1), 3);
    t.is(binarySearch(array, 4, 0, array.length - 1), 4);

    array.push([5]);
    t.is(binarySearch(array, 0, 0, array.length - 1), 0);
    t.is(binarySearch(array, 1, 0, array.length - 1), 1);
    t.is(binarySearch(array, 2, 0, array.length - 1), 2);
    t.is(binarySearch(array, 3, 0, array.length - 1), 3);
    t.is(binarySearch(array, 4, 0, array.length - 1), 4);
    t.is(binarySearch(array, 5, 0, array.length - 1), 5);
  });

  test('for non-match returns index for value lower than needle', (t) => {
    // Test middles, which have a number left and right of index.
    const array: SourceMapSegment[] = [];

    array.push([0]);
    t.is(binarySearch(array, -1, 0, array.length - 1), -1);
    t.is(binarySearch(array, 1, 0, array.length - 1), 0);

    array.push([2]);
    t.is(binarySearch(array, -1, 0, array.length - 1), -1);
    t.is(binarySearch(array, 1, 0, array.length - 1), 0);
    t.is(binarySearch(array, 3, 0, array.length - 1), 1);

    array.push([4]);
    t.is(binarySearch(array, -1, 0, array.length - 1), -1);
    t.is(binarySearch(array, 1, 0, array.length - 1), 0);
    t.is(binarySearch(array, 3, 0, array.length - 1), 1);
    t.is(binarySearch(array, 5, 0, array.length - 1), 2);

    array.push([6]);
    t.is(binarySearch(array, -1, 0, array.length - 1), -1);
    t.is(binarySearch(array, 1, 0, array.length - 1), 0);
    t.is(binarySearch(array, 3, 0, array.length - 1), 1);
    t.is(binarySearch(array, 5, 0, array.length - 1), 2);
    t.is(binarySearch(array, 7, 0, array.length - 1), 3);

    array.push([8]);
    t.is(binarySearch(array, -1, 0, array.length - 1), -1);
    t.is(binarySearch(array, 1, 0, array.length - 1), 0);
    t.is(binarySearch(array, 3, 0, array.length - 1), 1);
    t.is(binarySearch(array, 5, 0, array.length - 1), 2);
    t.is(binarySearch(array, 7, 0, array.length - 1), 3);
    t.is(binarySearch(array, 9, 0, array.length - 1), 4);

    array.push([10]);
    t.is(binarySearch(array, -1, 0, array.length - 1), -1);
    t.is(binarySearch(array, 1, 0, array.length - 1), 0);
    t.is(binarySearch(array, 3, 0, array.length - 1), 1);
    t.is(binarySearch(array, 5, 0, array.length - 1), 2);
    t.is(binarySearch(array, 7, 0, array.length - 1), 3);
    t.is(binarySearch(array, 9, 0, array.length - 1), 4);
    t.is(binarySearch(array, 11, 0, array.length - 1), 5);
  });

  test('needle is lower than all elements returns -1', (t) => {
    const array: SourceMapSegment[] = [];
    const needle = -1;

    array.push([0]);
    t.is(binarySearch(array, needle, 0, array.length - 1), -1);

    array.push([1]);
    t.is(binarySearch(array, needle, 0, array.length - 1), -1);

    array.push([2]);
    t.is(binarySearch(array, needle, 0, array.length - 1), -1);

    array.push([3]);
    t.is(binarySearch(array, needle, 0, array.length - 1), -1);

    array.push([4]);
    t.is(binarySearch(array, needle, 0, array.length - 1), -1);

    array.push([5]);
    t.is(binarySearch(array, needle, 0, array.length - 1), -1);
  });

  test('needle is higher than all elements returns last index', (t) => {
    const array: SourceMapSegment[] = [];
    const needle = 2 ** 16;

    array.push([0]);
    t.is(binarySearch(array, needle, 0, array.length - 1), array.length - 1);

    array.push([1]);
    t.is(binarySearch(array, needle, 0, array.length - 1), array.length - 1);

    array.push([2]);
    t.is(binarySearch(array, needle, 0, array.length - 1), array.length - 1);

    array.push([3]);
    t.is(binarySearch(array, needle, 0, array.length - 1), array.length - 1);

    array.push([4]);
    t.is(binarySearch(array, needle, 0, array.length - 1), array.length - 1);

    array.push([5]);
    t.is(binarySearch(array, needle, 0, array.length - 1), array.length - 1);
  });

  test('empty array returns -1', (t) => {
    const array: SourceMapSegment[] = [];

    t.is(binarySearch(array, -1, 0, array.length - 1), -1);
    t.is(binarySearch(array, 0, 0, array.length - 1), -1);
    t.is(binarySearch(array, 1, 0, array.length - 1), -1);
  });

  test('multiple items in array returns any match', (t) => {
    const array: SourceMapSegment[] = [];
    const needle = 1;

    array.push([needle]);
    t.is(binarySearch(array, needle, 0, array.length - 1), 0);

    array.push([needle]);
    t.is(binarySearch(array, needle, 0, array.length - 1), 0);

    array.push([needle]);
    t.is(binarySearch(array, needle, 0, array.length - 1), 1);

    array.push([needle]);
    t.is(binarySearch(array, needle, 0, array.length - 1), 1);

    array.push([needle]);
    t.is(binarySearch(array, needle, 0, array.length - 1), 2);

    array.push([needle]);
    t.is(binarySearch(array, needle, 0, array.length - 1), 2);
  });

  describe('low', () => {
    test('low equals needle index returns needle index', (t) => {
      const array: SourceMapSegment[] = [];

      array.push([0]);
      t.is(binarySearch(array, 0, 0, array.length - 1), 0);

      array.push([1]);
      t.is(binarySearch(array, 0, 0, array.length - 1), 0);
      t.is(binarySearch(array, 1, 1, array.length - 1), 1);

      array.push([2]);
      t.is(binarySearch(array, 0, 0, array.length - 1), 0);
      t.is(binarySearch(array, 1, 1, array.length - 1), 1);
      t.is(binarySearch(array, 2, 2, array.length - 1), 2);

      array.push([3]);
      t.is(binarySearch(array, 0, 0, array.length - 1), 0);
      t.is(binarySearch(array, 1, 1, array.length - 1), 1);
      t.is(binarySearch(array, 2, 2, array.length - 1), 2);
      t.is(binarySearch(array, 3, 3, array.length - 1), 3);

      array.push([4]);
      t.is(binarySearch(array, 0, 0, array.length - 1), 0);
      t.is(binarySearch(array, 1, 1, array.length - 1), 1);
      t.is(binarySearch(array, 2, 2, array.length - 1), 2);
      t.is(binarySearch(array, 3, 3, array.length - 1), 3);
      t.is(binarySearch(array, 4, 4, array.length - 1), 4);

      array.push([5]);
      t.is(binarySearch(array, 0, 0, array.length - 1), 0);
      t.is(binarySearch(array, 1, 1, array.length - 1), 1);
      t.is(binarySearch(array, 2, 2, array.length - 1), 2);
      t.is(binarySearch(array, 3, 3, array.length - 1), 3);
      t.is(binarySearch(array, 4, 4, array.length - 1), 4);
      t.is(binarySearch(array, 5, 5, array.length - 1), 5);
    });

    test('low higher than needle index returns left of high', (t) => {
      const array: SourceMapSegment[] = [];

      array.push([0]);

      array.push([1]);
      t.is(binarySearch(array, 0, 1, array.length - 1), 0);

      array.push([2]);
      t.is(binarySearch(array, 0, 1, array.length - 1), 0);
      t.is(binarySearch(array, 0, 2, array.length - 1), 1);
      t.is(binarySearch(array, 1, 2, array.length - 1), 1);

      array.push([3]);
      t.is(binarySearch(array, 0, 1, array.length - 1), 0);
      t.is(binarySearch(array, 0, 2, array.length - 1), 1);
      t.is(binarySearch(array, 0, 3, array.length - 1), 2);
      t.is(binarySearch(array, 1, 2, array.length - 1), 1);
      t.is(binarySearch(array, 1, 3, array.length - 1), 2);
      t.is(binarySearch(array, 2, 3, array.length - 1), 2);

      array.push([4]);
      t.is(binarySearch(array, 0, 1, array.length - 1), 0);
      t.is(binarySearch(array, 0, 2, array.length - 1), 1);
      t.is(binarySearch(array, 0, 3, array.length - 1), 2);
      t.is(binarySearch(array, 0, 4, array.length - 1), 3);
      t.is(binarySearch(array, 1, 2, array.length - 1), 1);
      t.is(binarySearch(array, 1, 3, array.length - 1), 2);
      t.is(binarySearch(array, 1, 4, array.length - 1), 3);
      t.is(binarySearch(array, 2, 3, array.length - 1), 2);
      t.is(binarySearch(array, 2, 4, array.length - 1), 3);
      t.is(binarySearch(array, 3, 4, array.length - 1), 3);
    });

    test('low lower than needle index returns needle index', (t) => {
      const array: SourceMapSegment[] = [];

      array.push([0]);

      array.push([1]);
      t.is(binarySearch(array, 1, 0, array.length - 1), 1);

      array.push([2]);
      t.is(binarySearch(array, 1, 0, array.length - 1), 1);
      t.is(binarySearch(array, 2, 0, array.length - 1), 2);
      t.is(binarySearch(array, 2, 1, array.length - 1), 2);

      array.push([3]);
      t.is(binarySearch(array, 1, 0, array.length - 1), 1);
      t.is(binarySearch(array, 2, 0, array.length - 1), 2);
      t.is(binarySearch(array, 2, 1, array.length - 1), 2);
      t.is(binarySearch(array, 3, 0, array.length - 1), 3);
      t.is(binarySearch(array, 3, 1, array.length - 1), 3);
      t.is(binarySearch(array, 3, 2, array.length - 1), 3);

      array.push([4]);
      t.is(binarySearch(array, 1, 0, array.length - 1), 1);
      t.is(binarySearch(array, 2, 0, array.length - 1), 2);
      t.is(binarySearch(array, 2, 1, array.length - 1), 2);
      t.is(binarySearch(array, 3, 0, array.length - 1), 3);
      t.is(binarySearch(array, 3, 1, array.length - 1), 3);
      t.is(binarySearch(array, 3, 2, array.length - 1), 3);
      t.is(binarySearch(array, 4, 0, array.length - 1), 4);
      t.is(binarySearch(array, 4, 1, array.length - 1), 4);
      t.is(binarySearch(array, 4, 2, array.length - 1), 4);
      t.is(binarySearch(array, 4, 3, array.length - 1), 4);
    });
  });

  describe('high', () => {
    test('high equals needle index returns needle index', (t) => {
      const array: SourceMapSegment[] = [];

      array.push([0]);
      t.is(binarySearch(array, 0, 0, 0), 0);

      array.push([1]);
      t.is(binarySearch(array, 0, 0, 0), 0);
      t.is(binarySearch(array, 1, 0, 1), 1);

      array.push([2]);
      t.is(binarySearch(array, 0, 0, 0), 0);
      t.is(binarySearch(array, 1, 0, 1), 1);
      t.is(binarySearch(array, 2, 0, 2), 2);

      array.push([3]);
      t.is(binarySearch(array, 0, 0, 0), 0);
      t.is(binarySearch(array, 1, 0, 1), 1);
      t.is(binarySearch(array, 2, 0, 2), 2);
      t.is(binarySearch(array, 3, 0, 3), 3);

      array.push([4]);
      t.is(binarySearch(array, 0, 0, 0), 0);
      t.is(binarySearch(array, 1, 0, 1), 1);
      t.is(binarySearch(array, 2, 0, 2), 2);
      t.is(binarySearch(array, 3, 0, 3), 3);
      t.is(binarySearch(array, 4, 0, 4), 4);

      array.push([5]);
      t.is(binarySearch(array, 0, 0, 0), 0);
      t.is(binarySearch(array, 1, 0, 1), 1);
      t.is(binarySearch(array, 2, 0, 2), 2);
      t.is(binarySearch(array, 3, 0, 3), 3);
      t.is(binarySearch(array, 4, 0, 4), 4);
      t.is(binarySearch(array, 5, 0, 5), 5);
    });

    test('high higher than needle index returns needle index', (t) => {
      const array: SourceMapSegment[] = [];

      array.push([0]);

      array.push([1]);
      t.is(binarySearch(array, 0, 0, 1), 0);

      array.push([2]);
      t.is(binarySearch(array, 0, 0, 1), 0);
      t.is(binarySearch(array, 0, 0, 2), 0);
      t.is(binarySearch(array, 1, 0, 2), 1);

      array.push([3]);
      t.is(binarySearch(array, 0, 0, 1), 0);
      t.is(binarySearch(array, 0, 0, 2), 0);
      t.is(binarySearch(array, 0, 0, 3), 0);
      t.is(binarySearch(array, 1, 0, 2), 1);
      t.is(binarySearch(array, 1, 0, 3), 1);
      t.is(binarySearch(array, 2, 0, 3), 2);

      array.push([4]);
      t.is(binarySearch(array, 0, 0, 1), 0);
      t.is(binarySearch(array, 0, 0, 2), 0);
      t.is(binarySearch(array, 0, 0, 3), 0);
      t.is(binarySearch(array, 0, 0, 4), 0);
      t.is(binarySearch(array, 1, 0, 2), 1);
      t.is(binarySearch(array, 1, 0, 3), 1);
      t.is(binarySearch(array, 1, 0, 4), 1);
      t.is(binarySearch(array, 2, 0, 3), 2);
      t.is(binarySearch(array, 2, 0, 4), 2);
      t.is(binarySearch(array, 3, 0, 4), 3);
    });

    test('high lower than needle index returns high', (t) => {
      const array: SourceMapSegment[] = [];

      array.push([0]);

      array.push([1]);
      t.is(binarySearch(array, 1, 0, 0), 0);

      array.push([2]);
      t.is(binarySearch(array, 1, 0, 0), 0);
      t.is(binarySearch(array, 2, 0, 0), 0);
      t.is(binarySearch(array, 2, 0, 1), 1);

      array.push([3]);
      t.is(binarySearch(array, 1, 0, 0), 0);
      t.is(binarySearch(array, 2, 0, 0), 0);
      t.is(binarySearch(array, 2, 0, 1), 1);
      t.is(binarySearch(array, 3, 0, 0), 0);
      t.is(binarySearch(array, 3, 0, 1), 1);
      t.is(binarySearch(array, 3, 0, 2), 2);

      array.push([4]);
      t.is(binarySearch(array, 1, 0, 0), 0);
      t.is(binarySearch(array, 2, 0, 0), 0);
      t.is(binarySearch(array, 2, 0, 1), 1);
      t.is(binarySearch(array, 3, 0, 0), 0);
      t.is(binarySearch(array, 3, 0, 1), 1);
      t.is(binarySearch(array, 3, 0, 2), 2);
      t.is(binarySearch(array, 4, 0, 0), 0);
      t.is(binarySearch(array, 4, 0, 1), 1);
      t.is(binarySearch(array, 4, 0, 2), 2);
      t.is(binarySearch(array, 4, 0, 3), 3);
    });
  });
});

describe('memoizedBinarySearch', () => {
  const array: SourceMapSegment[] = [[0], [5], [10]];

  test('refinds same index', (t) => {
    const memo = memoizedState();

    t.is(memoizedBinarySearch(array, 6, memo, 0), 1);
    t.is(memoizedBinarySearch(array, 6, memo, 0), 1);
  });

  test('restores found state', (t) => {
    const memo = memoizedState();

    t.is(memoizedBinarySearch(array, 6, memo, 0), 1);
    binarySearch(array, 0, 0, array.length - 1);
    t.is(found, true);
    t.is(memoizedBinarySearch(array, 6, memo, 0), 1);
    t.is(found, false);
  });
});
