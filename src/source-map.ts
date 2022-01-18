import resolve from './resolve';
import { encode, decode } from 'sourcemap-codec';

import type {
  SourceMapV3,
  DecodedSourceMap,
  EncodedSourceMap,
  InvalidMapping,
  Mapping,
  SourceMapSegment,
} from './types';

const INVALID_MAPPING: InvalidMapping = Object.freeze({
  source: null,
  line: null,
  column: null,
  name: null,
});

type Needle = { line: number; column: number };

export abstract class SourceMap {
  private declare _map: DecodedSourceMap | EncodedSourceMap;

  protected _lastIndex = 0;
  protected _lastLine = 0;
  protected _lastColumn = 0;

  constructor(map: DecodedSourceMap | EncodedSourceMap) {
    this._map = map;
  }

  get version(): SourceMapV3['version'] {
    return this._map.version;
  }

  get file(): SourceMapV3['file'] {
    return this._map.file;
  }

  get names(): SourceMapV3['names'] {
    return this._map.names;
  }

  get sourceRoot(): SourceMapV3['sourceRoot'] {
    return this._map.sourceRoot;
  }

  get sources(): SourceMapV3['sources'] {
    return this._map.sources;
  }

  get sourcesContent(): SourceMapV3['sourcesContent'] {
    return this._map.sourcesContent;
  }

  get encodedMappings(): EncodedSourceMap['mappings'] {
    const { mappings } = this._map;
    if (typeof mappings === 'string') return mappings;
    return encode(mappings);
  }

  get decodedMappings(): DecodedSourceMap['mappings'] {
    const { mappings } = this._map;
    if (!(typeof mappings === 'string')) return mappings;
    return decode(mappings);
  }

  abstract traceSegment(this: SourceMap, line: number, column: number): SourceMapSegment | null;

  originalPositionFor({ line, column }: Needle): Mapping | InvalidMapping {
    if (line < 1) throw new Error('`line` must be greater than 0 (lines start at line 1)');
    if (column < 0) {
      throw new Error('`column` must be greater than or equal to 0 (columns start at column 0)');
    }

    const segment = this.traceSegment(line - 1, column);
    if (segment == null) return INVALID_MAPPING;
    if (segment.length == 1) return INVALID_MAPPING;

    const { names, sourceRoot, sources } = this._map;
    return {
      source: resolve(String(sources[segment[1]]), sourceRoot),
      line: segment[2] + 1,
      column: segment[3],
      name: segment.length === 5 ? names[segment[4]] : null,
    };
  }
}
