import { memoizedBinarySearch } from './binary-search';
import { ITEM_LENGTH, decode } from './decode-vlq';

import type {
  SourceMap,
  SourceMapSegment,
  DecodedSourceMap,
  EncodedSourceMap,
  MapSegmentFn,
} from './types';

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
    return this.map(segmentify);
  }

  map<T>(fn: MapSegmentFn<T>): NonNullable<T>[][] {
    const { _mappings: mappings, _lineIndices: lineIndices } = this;

    const mapOut: NonNullable<T>[][] = [];
    let lineOut: NonNullable<T>[] = [];
    let generatedLine = 0;
    let lineIndex = lineIndices[generatedLine + 1];
    for (let i = 0; i < mappings.length; ) {
      while (i < lineIndex) {
        const segOut = fn(
          generatedLine,
          mappings[i + 0],
          mappings[i + 1] - 1,
          mappings[i + 2] - 1,
          mappings[i + 3] - 1,
          mappings[i + 4] - 1,
        );
        if (segOut != null) lineOut.push(segOut as NonNullable<T>);
        i += ITEM_LENGTH;
      }

      do {
        mapOut.push(lineOut);
        lineOut = [];
        generatedLine++;
        lineIndex = lineIndices[generatedLine + 1];
      } while (i === lineIndex);
    }

    return mapOut;
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
    return segmentify(
      line,
      mappings[index + 0],
      mappings[index + 1] - 1,
      mappings[index + 2] - 1,
      mappings[index + 3] - 1,
      mappings[index + 4] - 1,
    );
  }
}

function segmentify(
  _genLine: number,
  genCol: number,
  source: number,
  line: number,
  col: number,
  name: number,
): SourceMapSegment {
  // If the sourcesIndex is -1, then the VLQ segment didn't specify 2-5 values.
  if (source === -1) return [genCol];

  // If the namesIndex is -1, then the VLQ segment didn't specify 5th value.
  if (name === -1) return [genCol, source, line, col];

  return [genCol, source, line, col, name];
}

function searchComparator(column: number, needle: number): number {
  return column - needle;
}
