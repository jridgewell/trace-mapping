import type { SourceMapSegment } from './types';

type MemoState = {
  _lastLine: number;
  _lastColumn: number;
  _lastIndex: number;
};

/**
 * A binary search implementation that returns the index if a match is found.
 * If no match is found, then the left-index (the index associated with the item that comes just
 * before the desired index) is returned. To maintain proper sort order, a splice would happen at
 * the next index:
 *
 * The `comparator` callback receives both the `item` under comparison and the
 * needle we are searching for. It must return `0` if the `item` is a match,
 * any negative number if `item` is too small (and we must search after it), or
 * any positive number if the `item` is too large (and we must search before
 * it).
 *
 *
 * ```js
 * const array = [1, 3];
 * const needle = 2;
 * const index = binarySearch(array, needle, (item, needle) => item - needle);
 *
 * assert.equal(index, 0);
 * array.splice(index + 1, 0, needle);
 * assert.deepEqual(array, [1, 2, 3]);
 * ```
 */
export function binarySearch(
  haystack: SourceMapSegment[],
  needle: number,
  low: number,
  high: number,
): number {
  while (low <= high) {
    const mid = low + ((high - low) >> 1);
    const cmp = haystack[mid][0] - needle;

    if (cmp === 0) {
      return mid;
    }

    if (cmp < 0) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return low - 1;
}

export function memoizedState(): MemoState {
  return {
    _lastLine: -1,
    _lastColumn: -1,
    _lastIndex: -1,
  };
}

/**
 * This overly complicated beast is just to record the last tested line/column and the resulting
 * index, allowing us to skip a few tests if mappings are monotonically increasing.
 */
export function memoizedBinarySearch(
  haystack: SourceMapSegment[],
  needle: number,
  state: MemoState,
  line: number,
  column: number,
): number {
  const { _lastLine: lastLine, _lastColumn: lastColumn, _lastIndex: lastIndex } = state;

  let low = 0;
  let high = haystack.length - 1;
  if (line === lastLine) {
    if (column === lastColumn) {
      return lastIndex;
    }

    if (column >= lastColumn) {
      low = Math.max(lastIndex, 0);
    } else {
      high = lastIndex;
    }
  }
  state._lastLine = line;
  state._lastColumn = column;

  return (state._lastIndex = binarySearch(haystack, needle, low, high));
}
