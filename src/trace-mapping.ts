import resolve from './resolve';
import stripFilename from './strip-filename';
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

const INVALID_MAPPING: InvalidMapping = Object.freeze({
  source: null,
  line: null,
  column: null,
  name: null,
});

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

  originalPositionFor({ line, column }: Needle): Mapping | InvalidMapping {
    if (line < 1) throw new Error('`line` must be greater than 0 (lines start at line 1)');
    if (column < 0) {
      throw new Error('`column` must be greater than or equal to 0 (columns start at column 0)');
    }

    const segment = this.traceSegment(line - 1, column);
    if (segment == null) return INVALID_MAPPING;
    if (segment.length == 1) return INVALID_MAPPING;

    const { names, sources } = this;
    return {
      source: this.resolve(String(sources[segment[1]]), ''),
      line: segment[2] + 1,
      column: segment[3],
      name: segment.length === 5 ? names[segment[4]] : null,
    };
  }

  resolve(source: string, mapUrl?: string): string {
    const { sourceRoot } = this;
    return resolve(source, resolve(sourceRoot || '', stripFilename(mapUrl)));
  }
}

export { TraceMap as default };
