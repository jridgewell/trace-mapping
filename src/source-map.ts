import type { DecodedSourceMap, EncodedSourceMap, SourceMapSegment } from './types';

export abstract class SourceMap {
  private declare _map: DecodedSourceMap | EncodedSourceMap;

  protected _lastIndex = 0;
  protected _lastLine = 0;
  protected _lastColumn = 0;

  constructor(map: DecodedSourceMap | EncodedSourceMap) {
    this._map = map;
  }

  abstract encodedMappings(): EncodedSourceMap['mappings'];
  abstract decodedMappings(): DecodedSourceMap['mappings'];

  abstract traceSegment(this: SourceMap, line: number, column: number): SourceMapSegment | null;
}
