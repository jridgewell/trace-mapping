import type { EncodedSourceMap, DecodedSourceMap, SourceMapInput } from './types';
export type { SourceMapSegment, SourceMapInput, DecodedSourceMap, EncodedSourceMap } from './types';

import { DecodedSourceMapImpl } from './decoded-map';
import { EncodedSourceMapImpl } from './encoded-map';

export function TraceMap(map: SourceMapInput): EncodedSourceMapImpl | DecodedSourceMapImpl {
  const isString = typeof map === 'string';
  const parsed = isString ? JSON.parse(map) : map;

  if (typeof parsed.mappings === 'string') {
    return new EncodedSourceMapImpl(parsed as EncodedSourceMap);
  }
  return new DecodedSourceMapImpl(parsed as DecodedSourceMap, isString);
}

export { TraceMap as default };
