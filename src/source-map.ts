import type { DecodedSourceMap, EncodedSourceMap, SourceMapSegment } from './types';

export abstract class SourceMap {
  abstract encodedMappings(): EncodedSourceMap['mappings'];
  abstract decodedMappings(): DecodedSourceMap['mappings'];

  abstract traceSegment(this: SourceMap, line: number, column: number): SourceMapSegment | null;
}
