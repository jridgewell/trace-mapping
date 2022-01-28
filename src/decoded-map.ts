import { encode } from 'sourcemap-codec';

import { memoizedBinarySearch } from './binary-search';

import type {
  SourceMap,
  SourceMapSegment,
  EncodedSourceMap,
  DecodedSourceMap,
  EachSegmentFn,
} from './types';

const ITEM_LENGTH = 1;

export class DecodedSourceMapImpl implements SourceMap {
  private declare _mappings: SourceMapSegment[][];

  _lastIndex = 0;
  _lastLine = 0;
  _lastColumn = 0;

  constructor(map: DecodedSourceMap, owned: boolean) {
    this._mappings = maybeSort(map.mappings, owned);
  }

  encodedMappings(): EncodedSourceMap['mappings'] {
    return encode(this._mappings);
  }

  decodedMappings(): DecodedSourceMap['mappings'] {
    return this._mappings;
  }

  eachSegment(fn: EachSegmentFn) {
    const mappings = this._mappings;
    for (let i = 0; i < mappings.length; i++) {
      const line = mappings[i];
      for (let j = 0; j < line.length; j++) {
        const segment = line[j];
        const { length } = segment;

        if (length === 4) fn(i, segment[0], segment[1], segment[2], segment[3], -1);
        else if (length === 5) fn(i, segment[0], segment[1], segment[2], segment[3], segment[4]);
        else fn(i, segment[0], -1, -1, -1, -1);
      }
    }
  }

  traceSegment(line: number, column: number): SourceMapSegment | null {
    const mappings = this._mappings;

    // It's common for parent source maps to have pointers to lines that have no
    // mapping (like a "//# sourceMappingURL=") at the end of the child file.
    if (line >= mappings.length) return null;

    const segments = mappings[line];

    const index = memoizedBinarySearch(
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
    if (index < 0) return null;
    return segments[index];
  }
}

function maybeSort(mappings: SourceMapSegment[][], owned: boolean): SourceMapSegment[][] {
  const unsortedIndex = nextUnsortedSegmentLine(mappings, 0);
  if (unsortedIndex === mappings.length) return mappings;

  // If we own the array (meaning we parsed it from JSON), then we're free to directly mutate it. If
  // not, we do not want to modify the consumer's input array.
  if (!owned) mappings = mappings.slice();

  for (let i = unsortedIndex; i < mappings.length; i = nextUnsortedSegmentLine(mappings, i + 1)) {
    mappings[i] = sortSegments(mappings[i], owned);
  }
  return mappings;
}

function nextUnsortedSegmentLine(mappings: SourceMapSegment[][], start: number): number {
  for (let i = start; i < mappings.length; i++) {
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
  if (!owned) line = line.slice();
  return line.sort(sortComparator);
}

function sortComparator(a: SourceMapSegment, b: SourceMapSegment): number {
  return a[0] - b[0];
}

function searchComparator(segment: SourceMapSegment, needle: number): number {
  return segment[0] - needle;
}
