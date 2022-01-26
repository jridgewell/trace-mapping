import { encode } from 'sourcemap-codec';

import { memoizedBinarySearch } from './binary-search';

import type { SourceMap } from './source-map';
import type { SourceMapSegment, EncodedSourceMap, DecodedSourceMap } from './types';

const ITEM_LENGTH = 1;

export class DecodedSourceMapImpl implements SourceMap {
  private declare _mappings: SourceMapSegment[][];

  _lastIndex = 0;
  _lastLine = 0;
  _lastColumn = 0;

  constructor(map: DecodedSourceMap, owned: boolean) {
    this._mappings = sortMappings(map.mappings, owned);
  }

  encodedMappings(): EncodedSourceMap['mappings'] {
    return encode(this._mappings);
  }

  decodedMappings(): DecodedSourceMap['mappings'] {
    return this._mappings;
  }

  traceSegment(line: number, column: number): SourceMapSegment | null {
    const mappings = this._mappings;

    // It's common for parent source maps to have pointers to lines that have no
    // mapping (like a "//# sourceMappingURL=") at the end of the child file.
    if (line >= mappings.length) return null;

    const segments = mappings[line];

    let index = memoizedBinarySearch(
      segments,
      column,
      searchComparator,
      0,
      segments.length - ITEM_LENGTH,
      ITEM_LENGTH,
      this,
      line,
      column,
    );

    // we come before any mapped segment
    if (index === -1) return null;

    // If we can't find a segment that lines up to this column, we use the
    // segment before.
    if (index < 0) index = ~index - ITEM_LENGTH;

    return segments[index];
  }
}

function sortMappings(mappings: SourceMapSegment[][], owned: boolean): SourceMapSegment[][] {
  const unsortedIndex = firstUnsortedSegmentLine(mappings);
  if (unsortedIndex === mappings.length) return mappings;
  if (!owned) mappings = mappings.slice();
  for (let i = unsortedIndex; i < mappings.length; i++) {
    mappings[i] = sortSegments(mappings[i], owned);
  }
  return mappings;
}

function firstUnsortedSegmentLine(mappings: SourceMapSegment[][]): number {
  for (let i = 0; i < mappings.length; i++) {
    if (!isSorted(mappings[i])) return i;
  }
  return mappings.length;
}

function isSorted(line: SourceMapSegment[]): boolean {
  for (let j = 1; j < line.length; j++) {
    if (line[j][0] < line[j - 1][0]) {
      return false;
    }
  }
  return true;
}

function sortSegments(line: SourceMapSegment[], owned: boolean): SourceMapSegment[] {
  if (isSorted(line)) return line;
  if (!owned) line = line.slice();
  return line.sort(sortComparator);
}

function sortComparator(a: SourceMapSegment, b: SourceMapSegment): number {
  return a[0] - b[0];
}

function searchComparator(segment: SourceMapSegment, needle: number): number {
  return segment[0] - needle;
}
