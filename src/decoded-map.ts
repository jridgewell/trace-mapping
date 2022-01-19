import { encode } from 'sourcemap-codec';

import { SourceMap } from './source-map';
import binarySearch from './binary-search';

import type { SourceMapSegment, EncodedSourceMap, DecodedSourceMap } from './types';

export class DecodedSourceMapImpl extends SourceMap {
  private declare _mappings: SourceMapSegment[][];

  constructor(map: DecodedSourceMap, owned: boolean) {
    const mappings = sortMappings(map.mappings, owned);
    super(Object.assign({}, map, mappings));
    this._mappings = mappings;
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

    if (segments.length === 0) return null;

    let low = 0;
    let high = segments.length - 1;
    const { _lastLine: lastLine, _lastColumn: lastColumn, _lastIndex: lastIndex } = this;
    if (line === lastLine) {
      if (column === lastColumn) {
        return segments[lastIndex];
      }

      if (column >= lastColumn) {
        low = lastIndex;
      } else {
        high = lastIndex;
      }
    }
    this._lastLine = line;
    this._lastColumn = column;

    let index = binarySearch(segments, column, searchComparator, low, high);

    if (index === -1) {
      // we come before any mapped segment
      this._lastIndex = index;
      return null;
    }

    // If we can't find a segment that lines up to this column, we use the
    // segment before.
    if (index < 0) index = ~index - 1;
    this._lastIndex = index;

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
    const segments = mappings[i];
    for (let j = 1; j < segments.length; j++) {
      if (segments[j][0] < segments[j - 1][0]) {
        return i;
      }
    }
  }
  return mappings.length;
}

function sortSegments(segments: SourceMapSegment[], owned: boolean): SourceMapSegment[] {
  if (!owned) segments = segments.slice();
  return segments.sort(sortComparator);
}

function sortComparator(a: SourceMapSegment, b: SourceMapSegment): number {
  return a[0] - b[0];
}

function searchComparator(segment: SourceMapSegment, column: number): number {
  return segment[0] - column;
}
