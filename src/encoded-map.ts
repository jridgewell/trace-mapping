import { memoizedBinarySearch } from './binary-search';
import { ITEM_LENGTH, decode } from './decode-vlq';

import type { SourceMap, SourceMapSegment, DecodedSourceMap, EncodedSourceMap } from './types';

export class EncodedSourceMapImpl implements SourceMap {
  _lastIndex = 0;
  _lastLine = 0;
  _lastColumn = 0;

  private _lineIndices: number[] = [];
  private declare _encoded: string;
  private declare _mappings: Uint32Array;

  constructor(map: EncodedSourceMap) {
    this._encoded = map.mappings;
    this._mappings = decode(this._encoded, this._lineIndices);
  }

  encodedMappings(): EncodedSourceMap['mappings'] {
    return this._encoded;
  }

  decodedMappings(): DecodedSourceMap['mappings'] {
    const { _mappings: mappings, _lineIndices: lineIndices } = this;
    const decoded: SourceMapSegment[][] = [];
    let line: SourceMapSegment[] = [];

    let lineIndicesIndex = 1;
    let lineIndex = lineIndices[lineIndicesIndex];

    // The mappings TypedArray needs to be split on line boundaries to generate the proper decoded
    // mappings array.
    for (let i = 0; i < mappings.length; ) {
      while (i < lineIndex) {
        line.push(segmentify(mappings, i));
        i += ITEM_LENGTH;
      }
      do {
        lineIndex = lineIndices[++lineIndicesIndex];
        decoded.push(line);
        line = [];
      } while (i === lineIndex);
    }
    return decoded;
  }

  traceSegment(line: number, column: number): SourceMapSegment | null {
    const { _mappings: mappings, _lineIndices: lineIndices } = this;

    // It's common for parent source maps to have pointers to lines that have no
    // mapping (like a "//# sourceMappingURL=") at the end of the child file.
    if (line >= lineIndices.length - 1) return null;

    const index = memoizedBinarySearch(
      mappings,
      column,
      searchComparator,
      lineIndices[line],
      lineIndices[line + 1] - 1,
      ITEM_LENGTH,
      this,
      line,
      column,
    );

    // we come before any mapped segment
    if (index < 0) return null;
    return segmentify(mappings, index);
  }
}

function segmentify(mappings: Uint32Array, i: number): SourceMapSegment {
  // If the second index (sourcesIndex) is 0, then the VLQ segment didn't specify 2-5 values.
  if (mappings[i + 1] === 0) return [mappings[i]];

  // If the fifth index (namesIndex) is 0, then the VLQ segment didn't specify 5th value.
  // The sourcesIndex 1 higher than specified, so we need to decrement it.
  if (mappings[i + 4] === 0) {
    return [mappings[i], mappings[i + 1] - 1, mappings[i + 2], mappings[i + 3]];
  }

  // The sourcesIndex and namesIndex are both 1 higher than specified, so we need to decrement them.
  return [mappings[i], mappings[i + 1] - 1, mappings[i + 2], mappings[i + 3], mappings[i + 4] - 1];
}

function searchComparator(column: number, needle: number): number {
  return column - needle;
}
