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

export type Mapping = {
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
