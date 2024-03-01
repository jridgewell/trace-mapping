import type { SourceMapSegment } from './sourcemap-segment';
import type { GREATEST_LOWER_BOUND, LEAST_UPPER_BOUND, TraceMap } from './trace-mapping';

export interface SourceMapV3 {
  file?: string | null;
  names: string[];
  sourceRoot?: string;
  sources: (string | null)[];
  sourcesContent?: (string | null)[];
  version: 3;
  ignoreList?: number[];
}

export interface EncodedSourceMap extends SourceMapV3 {
  mappings: string;
}

export interface DecodedSourceMap extends SourceMapV3 {
  mappings: SourceMapSegment[][];
}

export interface Section {
  offset: {
    line: number;
    column: number;
  };
  map: EncodedSourceMap | DecodedSourceMap | SectionedSourceMap;
}

export interface SectionedSourceMap {
  file?: string | null;
  sections: Section[];
  version: 3;
}

export type OriginalMapping = {
  source: string | null;
  line: number;
  column: number;
  name: string | null;
};

export type InvalidOriginalMapping = {
  source: null;
  line: null;
  column: null;
  name: null;
};

export type GeneratedMapping = {
  line: number;
  column: number;
};
export type InvalidGeneratedMapping = {
  line: null;
  column: null;
};

export type Bias = typeof GREATEST_LOWER_BOUND | typeof LEAST_UPPER_BOUND;

export type XInput = { x_google_ignoreList?: SourceMapV3['ignoreList'] };
export type EncodedSourceMapXInput = EncodedSourceMap & XInput;
export type DecodedSourceMapXInput = DecodedSourceMap & XInput;
export type SectionedSourceMapXInput = Omit<SectionedSourceMap, 'sections'> & {
  sections: SectionXInput[];
};
export type SectionXInput = Omit<Section, 'map'> & {
  map: EncodedSourceMapXInput | DecodedSourceMapXInput | SectionedSourceMapXInput;
};

export type SourceMapInput =
  | string
  | Ro<EncodedSourceMapXInput>
  | Ro<DecodedSourceMapXInput>
  | TraceMap;
export type SectionedSourceMapInput = SourceMapInput | Ro<SectionedSourceMapXInput>;

export type Needle = { line: number; column: number; bias?: Bias };
export type SourceNeedle = { source: string; line: number; column: number; bias?: Bias };

export type EachMapping =
  | {
      generatedLine: number;
      generatedColumn: number;
      source: null;
      originalLine: null;
      originalColumn: null;
      name: null;
    }
  | {
      generatedLine: number;
      generatedColumn: number;
      source: string | null;
      originalLine: number;
      originalColumn: number;
      name: string | null;
    };

export abstract class SourceMap {
  declare version: SourceMapV3['version'];
  declare file: SourceMapV3['file'];
  declare names: SourceMapV3['names'];
  declare sourceRoot: SourceMapV3['sourceRoot'];
  declare sources: SourceMapV3['sources'];
  declare sourcesContent: SourceMapV3['sourcesContent'];
  declare resolvedSources: SourceMapV3['sources'];
  declare ignoreList: SourceMapV3['ignoreList'];
}

export type Ro<T> = T extends Array<infer V>
  ? V[] | Readonly<V[]> | RoArray<V> | Readonly<RoArray<V>>
  : T extends object
    ? T | Readonly<T> | RoObject<T> | Readonly<RoObject<T>>
    : T;
type RoArray<T> = Ro<T>[];
type RoObject<T> = { [K in keyof T]: T[K] | Ro<T[K]> };
