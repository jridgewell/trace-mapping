import { strict as assert } from 'assert';
import { binarySearch, found, memoizedState, memoizedBinarySearch } from '../src/binary-search';

type SourceMapSegment = [number];

describe('binary search', () => {
  it('returns index of match', () => {
    const array: SourceMapSegment[] = [];

    array.push([0]);
    assert.equal(binarySearch(array, 0, 0, array.length - 1), 0);

    array.push([1]);
    assert.equal(binarySearch(array, 0, 0, array.length - 1), 0);
    assert.equal(binarySearch(array, 1, 0, array.length - 1), 1);

    array.push([2]);
    assert.equal(binarySearch(array, 0, 0, array.length - 1), 0);
    assert.equal(binarySearch(array, 1, 0, array.length - 1), 1);
    assert.equal(binarySearch(array, 2, 0, array.length - 1), 2);

    array.push([3]);
    assert.equal(binarySearch(array, 0, 0, array.length - 1), 0);
    assert.equal(binarySearch(array, 1, 0, array.length - 1), 1);
    assert.equal(binarySearch(array, 2, 0, array.length - 1), 2);
    assert.equal(binarySearch(array, 3, 0, array.length - 1), 3);

    array.push([4]);
    assert.equal(binarySearch(array, 0, 0, array.length - 1), 0);
    assert.equal(binarySearch(array, 1, 0, array.length - 1), 1);
    assert.equal(binarySearch(array, 2, 0, array.length - 1), 2);
    assert.equal(binarySearch(array, 3, 0, array.length - 1), 3);
    assert.equal(binarySearch(array, 4, 0, array.length - 1), 4);

    array.push([5]);
    assert.equal(binarySearch(array, 0, 0, array.length - 1), 0);
    assert.equal(binarySearch(array, 1, 0, array.length - 1), 1);
    assert.equal(binarySearch(array, 2, 0, array.length - 1), 2);
    assert.equal(binarySearch(array, 3, 0, array.length - 1), 3);
    assert.equal(binarySearch(array, 4, 0, array.length - 1), 4);
    assert.equal(binarySearch(array, 5, 0, array.length - 1), 5);
  });

  it('for non-match returns index for value lower than needle', () => {
    // Test middles, which have a number left and right of index.
    const array: SourceMapSegment[] = [];

    array.push([0]);
    assert.equal(binarySearch(array, -1, 0, array.length - 1), -1);
    assert.equal(binarySearch(array, 1, 0, array.length - 1), 0);

    array.push([2]);
    assert.equal(binarySearch(array, -1, 0, array.length - 1), -1);
    assert.equal(binarySearch(array, 1, 0, array.length - 1), 0);
    assert.equal(binarySearch(array, 3, 0, array.length - 1), 1);

    array.push([4]);
    assert.equal(binarySearch(array, -1, 0, array.length - 1), -1);
    assert.equal(binarySearch(array, 1, 0, array.length - 1), 0);
    assert.equal(binarySearch(array, 3, 0, array.length - 1), 1);
    assert.equal(binarySearch(array, 5, 0, array.length - 1), 2);

    array.push([6]);
    assert.equal(binarySearch(array, -1, 0, array.length - 1), -1);
    assert.equal(binarySearch(array, 1, 0, array.length - 1), 0);
    assert.equal(binarySearch(array, 3, 0, array.length - 1), 1);
    assert.equal(binarySearch(array, 5, 0, array.length - 1), 2);
    assert.equal(binarySearch(array, 7, 0, array.length - 1), 3);

    array.push([8]);
    assert.equal(binarySearch(array, -1, 0, array.length - 1), -1);
    assert.equal(binarySearch(array, 1, 0, array.length - 1), 0);
    assert.equal(binarySearch(array, 3, 0, array.length - 1), 1);
    assert.equal(binarySearch(array, 5, 0, array.length - 1), 2);
    assert.equal(binarySearch(array, 7, 0, array.length - 1), 3);
    assert.equal(binarySearch(array, 9, 0, array.length - 1), 4);

    array.push([10]);
    assert.equal(binarySearch(array, -1, 0, array.length - 1), -1);
    assert.equal(binarySearch(array, 1, 0, array.length - 1), 0);
    assert.equal(binarySearch(array, 3, 0, array.length - 1), 1);
    assert.equal(binarySearch(array, 5, 0, array.length - 1), 2);
    assert.equal(binarySearch(array, 7, 0, array.length - 1), 3);
    assert.equal(binarySearch(array, 9, 0, array.length - 1), 4);
    assert.equal(binarySearch(array, 11, 0, array.length - 1), 5);
  });

  it('needle is lower than all elements returns -1', () => {
    const array: SourceMapSegment[] = [];
    const needle = -1;

    array.push([0]);
    assert.equal(binarySearch(array, needle, 0, array.length - 1), -1);

    array.push([1]);
    assert.equal(binarySearch(array, needle, 0, array.length - 1), -1);

    array.push([2]);
    assert.equal(binarySearch(array, needle, 0, array.length - 1), -1);

    array.push([3]);
    assert.equal(binarySearch(array, needle, 0, array.length - 1), -1);

    array.push([4]);
    assert.equal(binarySearch(array, needle, 0, array.length - 1), -1);

    array.push([5]);
    assert.equal(binarySearch(array, needle, 0, array.length - 1), -1);
  });

  it('needle is higher than all elements returns last index', () => {
    const array: SourceMapSegment[] = [];
    const needle = 2 ** 16;

    array.push([0]);
    assert.equal(binarySearch(array, needle, 0, array.length - 1), array.length - 1);

    array.push([1]);
    assert.equal(binarySearch(array, needle, 0, array.length - 1), array.length - 1);

    array.push([2]);
    assert.equal(binarySearch(array, needle, 0, array.length - 1), array.length - 1);

    array.push([3]);
    assert.equal(binarySearch(array, needle, 0, array.length - 1), array.length - 1);

    array.push([4]);
    assert.equal(binarySearch(array, needle, 0, array.length - 1), array.length - 1);

    array.push([5]);
    assert.equal(binarySearch(array, needle, 0, array.length - 1), array.length - 1);
  });

  it('empty array returns -1', () => {
    const array: SourceMapSegment[] = [];

    assert.equal(binarySearch(array, -1, 0, array.length - 1), -1);
    assert.equal(binarySearch(array, 0, 0, array.length - 1), -1);
    assert.equal(binarySearch(array, 1, 0, array.length - 1), -1);
  });

  it('multiple items in array returns any match', () => {
    const array: SourceMapSegment[] = [];
    const needle = 1;

    array.push([needle]);
    assert.equal(binarySearch(array, needle, 0, array.length - 1), 0);

    array.push([needle]);
    assert.equal(binarySearch(array, needle, 0, array.length - 1), 0);

    array.push([needle]);
    assert.equal(binarySearch(array, needle, 0, array.length - 1), 1);

    array.push([needle]);
    assert.equal(binarySearch(array, needle, 0, array.length - 1), 1);

    array.push([needle]);
    assert.equal(binarySearch(array, needle, 0, array.length - 1), 2);

    array.push([needle]);
    assert.equal(binarySearch(array, needle, 0, array.length - 1), 2);
  });

  describe('low', () => {
    it('low equals needle index returns needle index', () => {
      const array: SourceMapSegment[] = [];

      array.push([0]);
      assert.equal(binarySearch(array, 0, 0, array.length - 1), 0);

      array.push([1]);
      assert.equal(binarySearch(array, 0, 0, array.length - 1), 0);
      assert.equal(binarySearch(array, 1, 1, array.length - 1), 1);

      array.push([2]);
      assert.equal(binarySearch(array, 0, 0, array.length - 1), 0);
      assert.equal(binarySearch(array, 1, 1, array.length - 1), 1);
      assert.equal(binarySearch(array, 2, 2, array.length - 1), 2);

      array.push([3]);
      assert.equal(binarySearch(array, 0, 0, array.length - 1), 0);
      assert.equal(binarySearch(array, 1, 1, array.length - 1), 1);
      assert.equal(binarySearch(array, 2, 2, array.length - 1), 2);
      assert.equal(binarySearch(array, 3, 3, array.length - 1), 3);

      array.push([4]);
      assert.equal(binarySearch(array, 0, 0, array.length - 1), 0);
      assert.equal(binarySearch(array, 1, 1, array.length - 1), 1);
      assert.equal(binarySearch(array, 2, 2, array.length - 1), 2);
      assert.equal(binarySearch(array, 3, 3, array.length - 1), 3);
      assert.equal(binarySearch(array, 4, 4, array.length - 1), 4);

      array.push([5]);
      assert.equal(binarySearch(array, 0, 0, array.length - 1), 0);
      assert.equal(binarySearch(array, 1, 1, array.length - 1), 1);
      assert.equal(binarySearch(array, 2, 2, array.length - 1), 2);
      assert.equal(binarySearch(array, 3, 3, array.length - 1), 3);
      assert.equal(binarySearch(array, 4, 4, array.length - 1), 4);
      assert.equal(binarySearch(array, 5, 5, array.length - 1), 5);
    });

    it('low higher than needle index returns left of high', () => {
      const array: SourceMapSegment[] = [];

      array.push([0]);

      array.push([1]);
      assert.equal(binarySearch(array, 0, 1, array.length - 1), 0);

      array.push([2]);
      assert.equal(binarySearch(array, 0, 1, array.length - 1), 0);
      assert.equal(binarySearch(array, 0, 2, array.length - 1), 1);
      assert.equal(binarySearch(array, 1, 2, array.length - 1), 1);

      array.push([3]);
      assert.equal(binarySearch(array, 0, 1, array.length - 1), 0);
      assert.equal(binarySearch(array, 0, 2, array.length - 1), 1);
      assert.equal(binarySearch(array, 0, 3, array.length - 1), 2);
      assert.equal(binarySearch(array, 1, 2, array.length - 1), 1);
      assert.equal(binarySearch(array, 1, 3, array.length - 1), 2);
      assert.equal(binarySearch(array, 2, 3, array.length - 1), 2);

      array.push([4]);
      assert.equal(binarySearch(array, 0, 1, array.length - 1), 0);
      assert.equal(binarySearch(array, 0, 2, array.length - 1), 1);
      assert.equal(binarySearch(array, 0, 3, array.length - 1), 2);
      assert.equal(binarySearch(array, 0, 4, array.length - 1), 3);
      assert.equal(binarySearch(array, 1, 2, array.length - 1), 1);
      assert.equal(binarySearch(array, 1, 3, array.length - 1), 2);
      assert.equal(binarySearch(array, 1, 4, array.length - 1), 3);
      assert.equal(binarySearch(array, 2, 3, array.length - 1), 2);
      assert.equal(binarySearch(array, 2, 4, array.length - 1), 3);
      assert.equal(binarySearch(array, 3, 4, array.length - 1), 3);
    });

    it('low lower than needle index returns needle index', () => {
      const array: SourceMapSegment[] = [];

      array.push([0]);

      array.push([1]);
      assert.equal(binarySearch(array, 1, 0, array.length - 1), 1);

      array.push([2]);
      assert.equal(binarySearch(array, 1, 0, array.length - 1), 1);
      assert.equal(binarySearch(array, 2, 0, array.length - 1), 2);
      assert.equal(binarySearch(array, 2, 1, array.length - 1), 2);

      array.push([3]);
      assert.equal(binarySearch(array, 1, 0, array.length - 1), 1);
      assert.equal(binarySearch(array, 2, 0, array.length - 1), 2);
      assert.equal(binarySearch(array, 2, 1, array.length - 1), 2);
      assert.equal(binarySearch(array, 3, 0, array.length - 1), 3);
      assert.equal(binarySearch(array, 3, 1, array.length - 1), 3);
      assert.equal(binarySearch(array, 3, 2, array.length - 1), 3);

      array.push([4]);
      assert.equal(binarySearch(array, 1, 0, array.length - 1), 1);
      assert.equal(binarySearch(array, 2, 0, array.length - 1), 2);
      assert.equal(binarySearch(array, 2, 1, array.length - 1), 2);
      assert.equal(binarySearch(array, 3, 0, array.length - 1), 3);
      assert.equal(binarySearch(array, 3, 1, array.length - 1), 3);
      assert.equal(binarySearch(array, 3, 2, array.length - 1), 3);
      assert.equal(binarySearch(array, 4, 0, array.length - 1), 4);
      assert.equal(binarySearch(array, 4, 1, array.length - 1), 4);
      assert.equal(binarySearch(array, 4, 2, array.length - 1), 4);
      assert.equal(binarySearch(array, 4, 3, array.length - 1), 4);
    });
  });

  describe('high', () => {
    it('high equals needle index returns needle index', () => {
      const array: SourceMapSegment[] = [];

      array.push([0]);
      assert.equal(binarySearch(array, 0, 0, 0), 0);

      array.push([1]);
      assert.equal(binarySearch(array, 0, 0, 0), 0);
      assert.equal(binarySearch(array, 1, 0, 1), 1);

      array.push([2]);
      assert.equal(binarySearch(array, 0, 0, 0), 0);
      assert.equal(binarySearch(array, 1, 0, 1), 1);
      assert.equal(binarySearch(array, 2, 0, 2), 2);

      array.push([3]);
      assert.equal(binarySearch(array, 0, 0, 0), 0);
      assert.equal(binarySearch(array, 1, 0, 1), 1);
      assert.equal(binarySearch(array, 2, 0, 2), 2);
      assert.equal(binarySearch(array, 3, 0, 3), 3);

      array.push([4]);
      assert.equal(binarySearch(array, 0, 0, 0), 0);
      assert.equal(binarySearch(array, 1, 0, 1), 1);
      assert.equal(binarySearch(array, 2, 0, 2), 2);
      assert.equal(binarySearch(array, 3, 0, 3), 3);
      assert.equal(binarySearch(array, 4, 0, 4), 4);

      array.push([5]);
      assert.equal(binarySearch(array, 0, 0, 0), 0);
      assert.equal(binarySearch(array, 1, 0, 1), 1);
      assert.equal(binarySearch(array, 2, 0, 2), 2);
      assert.equal(binarySearch(array, 3, 0, 3), 3);
      assert.equal(binarySearch(array, 4, 0, 4), 4);
      assert.equal(binarySearch(array, 5, 0, 5), 5);
    });

    it('high higher than needle index returns needle index', () => {
      const array: SourceMapSegment[] = [];

      array.push([0]);

      array.push([1]);
      assert.equal(binarySearch(array, 0, 0, 1), 0);

      array.push([2]);
      assert.equal(binarySearch(array, 0, 0, 1), 0);
      assert.equal(binarySearch(array, 0, 0, 2), 0);
      assert.equal(binarySearch(array, 1, 0, 2), 1);

      array.push([3]);
      assert.equal(binarySearch(array, 0, 0, 1), 0);
      assert.equal(binarySearch(array, 0, 0, 2), 0);
      assert.equal(binarySearch(array, 0, 0, 3), 0);
      assert.equal(binarySearch(array, 1, 0, 2), 1);
      assert.equal(binarySearch(array, 1, 0, 3), 1);
      assert.equal(binarySearch(array, 2, 0, 3), 2);

      array.push([4]);
      assert.equal(binarySearch(array, 0, 0, 1), 0);
      assert.equal(binarySearch(array, 0, 0, 2), 0);
      assert.equal(binarySearch(array, 0, 0, 3), 0);
      assert.equal(binarySearch(array, 0, 0, 4), 0);
      assert.equal(binarySearch(array, 1, 0, 2), 1);
      assert.equal(binarySearch(array, 1, 0, 3), 1);
      assert.equal(binarySearch(array, 1, 0, 4), 1);
      assert.equal(binarySearch(array, 2, 0, 3), 2);
      assert.equal(binarySearch(array, 2, 0, 4), 2);
      assert.equal(binarySearch(array, 3, 0, 4), 3);
    });

    it('high lower than needle index returns high', () => {
      const array: SourceMapSegment[] = [];

      array.push([0]);

      array.push([1]);
      assert.equal(binarySearch(array, 1, 0, 0), 0);

      array.push([2]);
      assert.equal(binarySearch(array, 1, 0, 0), 0);
      assert.equal(binarySearch(array, 2, 0, 0), 0);
      assert.equal(binarySearch(array, 2, 0, 1), 1);

      array.push([3]);
      assert.equal(binarySearch(array, 1, 0, 0), 0);
      assert.equal(binarySearch(array, 2, 0, 0), 0);
      assert.equal(binarySearch(array, 2, 0, 1), 1);
      assert.equal(binarySearch(array, 3, 0, 0), 0);
      assert.equal(binarySearch(array, 3, 0, 1), 1);
      assert.equal(binarySearch(array, 3, 0, 2), 2);

      array.push([4]);
      assert.equal(binarySearch(array, 1, 0, 0), 0);
      assert.equal(binarySearch(array, 2, 0, 0), 0);
      assert.equal(binarySearch(array, 2, 0, 1), 1);
      assert.equal(binarySearch(array, 3, 0, 0), 0);
      assert.equal(binarySearch(array, 3, 0, 1), 1);
      assert.equal(binarySearch(array, 3, 0, 2), 2);
      assert.equal(binarySearch(array, 4, 0, 0), 0);
      assert.equal(binarySearch(array, 4, 0, 1), 1);
      assert.equal(binarySearch(array, 4, 0, 2), 2);
      assert.equal(binarySearch(array, 4, 0, 3), 3);
    });
  });
});

describe('memoizedBinarySearch', () => {
  const array: SourceMapSegment[] = [[1], [5], [10]];

  it('refinds same index', () => {
    const memo = memoizedState();

    assert.equal(memoizedBinarySearch(array, 6, memo, 0), 1);
    assert.equal(memoizedBinarySearch(array, 6, memo, 0), 1);
  });

  it('restores found state', () => {
    const memo1 = memoizedState();
    const memo2 = memoizedState();

    assert.equal(memoizedBinarySearch(array, 0, memo1, 0), -1);
    assert.equal(found, false);

    assert.equal(memoizedBinarySearch(array, 5, memo2, 0), 1);
    assert.equal(found, true);

    assert.equal(memoizedBinarySearch(array, 0, memo1, 0), -1);
    assert.equal(found, false);

    assert.equal(memoizedBinarySearch(array, 5, memo2, 0), 1);
    assert.equal(found, true);
  });
});
