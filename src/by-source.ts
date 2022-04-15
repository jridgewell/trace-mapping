import { COLUMN, SOURCES_INDEX, SOURCE_LINE, SOURCE_COLUMN } from './sourcemap-segment';
import { memoizedBinarySearch, memoizedState, found as bsFound } from './binary-search';

import type { ReverseSegment, SourceMapSegment } from './sourcemap-segment';

export type Source = {
  __proto__: null;
  [line: number]: Exclude<ReverseSegment, [number]>[];
};

// Rebuilds the original source files, with mappings that are ordered by source line/column instead
// of generated line/column.
export default function buildBySources(
  sourceFiles: (string | null)[],
  decoded: SourceMapSegment[][],
): Source[] {
  const sources: Source[] = sourceFiles.map(buildNullArray);

  let lastLine: ReverseSegment[] = [];
  const memo = memoizedState();
  for (let i = 0; i < decoded.length; i++) {
    const line = decoded[i];
    for (let j = 0; j < line.length; j++) {
      const seg = line[j];
      if (seg.length === 1) continue;

      const sourceColumn = seg[SOURCE_COLUMN];
      const originalSource = sources[seg[SOURCES_INDEX]];
      const originalLine = (originalSource[seg[SOURCE_LINE]] ||= []);

      // We really need two keys, the source index and the source line. But since that would cause a
      // slowdown for the basic usecase, we instead directly manipulate the lastKey. By making it
      // -1, and providing 0 as the key during memoized searches, we ensure that when the index/line
      // changes, we will bust the cache and perform a real search.
      if (lastLine !== originalLine) {
        lastLine = originalLine;
        memo.lastKey = -1;
      }

      const index = memoizedBinarySearch(originalLine, sourceColumn, memo, 0);
      if (!bsFound) insert(originalLine, index + 1, [sourceColumn, i, seg[COLUMN]]);
    }
  }

  return sources;
}

function insert<T>(array: T[], index: number, value: T) {
  for (let i = array.length; i > index; i--) {
    array[i] = array[i - 1];
  }
  array[index] = value;
}

// Null arrays allow us to use ordered index keys without actually allocating contiguous memory like
// a real array. We use a null-prototype object to avoid prototype pollution and deoptimizations.
// Numeric properties on objects are magically sorted in ascending order by the engine regardless of
// the insertion order. So, by setting any numeric keys, even out of order, we'll get ascending
// order when iterating with for-in.
function buildNullArray<T extends { __proto__: null }>(): T {
  return { __proto__: null } as T;
}
