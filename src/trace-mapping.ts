import { DecodedSourceMapImpl } from './decoded-map';
import { EncodedSourceMapImpl } from './encoded-map';

import type {
  SourceMapV3,
  DecodedSourceMap,
  EncodedSourceMap,
  InvalidMapping,
  Mapping,
  SourceMapSegment,
  SourceMapInput,
  Needle,
} from './types';

export type { SourceMapSegment, SourceMapInput, DecodedSourceMap, EncodedSourceMap } from './types';

export class TraceMap {
  declare version: SourceMapV3['version'];
  declare file: SourceMapV3['file'];
  declare names: SourceMapV3['names'];
  declare sourceRoot: SourceMapV3['sourceRoot'];
  declare sources: SourceMapV3['sources'];
  declare sourcesContent: SourceMapV3['sourcesContent'];

  private declare _impl: DecodedSourceMapImpl | EncodedSourceMapImpl;

  constructor(map: SourceMapInput) {
    const isString = typeof map === 'string';
    const parsed = isString ? (JSON.parse(map) as Exclude<SourceMapInput, string>) : map;

    this.version = parsed.version;
    this.file = parsed.file;
    this.names = parsed.names;
    this.sourceRoot = parsed.sourceRoot;
    this.sources = parsed.sources;
    this.sourcesContent = parsed.sourcesContent;

    if (typeof parsed.mappings === 'string') {
      this._impl = new EncodedSourceMapImpl(parsed as EncodedSourceMap);
    } else {
      this._impl = new DecodedSourceMapImpl(parsed as DecodedSourceMap, isString);
    }
  }

  encodedMappings(): EncodedSourceMap['mappings'] {
    return this._impl.encodedMappings();
  }

  decodedMappings(): DecodedSourceMap['mappings'] {
    return this._impl.decodedMappings();
  }

  traceSegment(line: number, column: number): SourceMapSegment | null {
    return this._impl.traceSegment(line, column);
  }

  originalPositionFor(needle: Needle): Mapping | InvalidMapping {
    return this._impl.originalPositionFor(needle);
  }
}

export { TraceMap as default };
