export interface SourceMapV3 {
  file?: string | null;
  names: string[];
  sourceRoot?: string;
  sources: (string | null)[];
  sourcesContent?: (string | null)[];
  version: 3;
}

type Column = number;
type SourcesIndex = number;
type SourceLine = number;
type SourceColumn = number;
type NamesIndex = number;

export type SourceMapSegment =
  | [Column]
  | [Column, SourcesIndex, SourceLine, SourceColumn]
  | [Column, SourcesIndex, SourceLine, SourceColumn, NamesIndex];

export interface EncodedSourceMap extends SourceMapV3 {
  mappings: string;
}

export interface DecodedSourceMap extends SourceMapV3 {
  mappings: SourceMapSegment[][];
}

export type OriginalMapping = {
  source: string | null;
  line: number;
  column: number;
  name: string | null;
};

export type InvalidMapping = {
  source: null;
  line: null;
  column: null;
  name: null;
};

export type SourceMapInput = string | EncodedSourceMap | DecodedSourceMap;

export type Needle = { line: number; column: number };

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
}
