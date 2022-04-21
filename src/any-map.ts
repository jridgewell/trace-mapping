import { TraceMap, presortedDecodedMap, decodedMappings } from './trace-mapping';
import {
  COLUMN,
  SOURCES_INDEX,
  SOURCE_LINE,
  SOURCE_COLUMN,
  NAMES_INDEX,
} from './sourcemap-segment';

import type {
  Section,
  SectionedSourceMap,
  DecodedSourceMap,
  SectionedSourceMapInput,
} from './types';
import type { SourceMapSegment } from './sourcemap-segment';

type AnyMap = {
  new (map: SectionedSourceMapInput, mapUrl?: string | null): TraceMap;
  (map: SectionedSourceMapInput, mapUrl?: string | null): TraceMap;
};

export const AnyMap: AnyMap = function (map, mapUrl) {
  const parsed =
    typeof map === 'string' ? (JSON.parse(map) as Exclude<SectionedSourceMapInput, string>) : map;

  if (!('sections' in parsed)) return new TraceMap(parsed, mapUrl);

  const mappings: SourceMapSegment[][] = [];
  const sources: string[] = [];
  const sourcesContent: (string | null)[] = [];
  const names: string[] = [];

  recurse(parsed, mapUrl, mappings, sources, sourcesContent, names, 0, 0, Infinity, Infinity);

  const joined: DecodedSourceMap = {
    version: 3,
    file: parsed.file,
    names,
    sources,
    sourcesContent,
    mappings,
  };

  return presortedDecodedMap(joined);
} as AnyMap;

function recurse(
  input: SectionedSourceMap,
  mapUrl: string | null | undefined,
  mappings: SourceMapSegment[][],
  sources: string[],
  sourcesContent: (string | null)[],
  names: string[],
  lineOffset: number,
  columnOffset: number,
  stopLine: number,
  stopColumn: number,
) {
  const { sections } = input;
  let i = 0;
  for (; i < sections.length - 1; i++) {
    const { map, offset } = sections[i];
    const nextOffset = sections[i + 1].offset;

    let sl = lineOffset + nextOffset.line;
    let sc = columnOffset + nextOffset.column;
    if (sl === stopLine) {
      sc = Math.min(sc, stopColumn);
    } else if (sl > stopLine) {
      sl = stopLine;
      sc = stopColumn;
    }

    addSection(
      map,
      mapUrl,
      mappings,
      sources,
      sourcesContent,
      names,
      lineOffset + offset.line,
      columnOffset + offset.column,
      sl,
      sc,
    );
  }

  if (sections.length > 0) {
    const { map, offset } = sections[i];
    addSection(
      map,
      mapUrl,
      mappings,
      sources,
      sourcesContent,
      names,
      lineOffset + offset.line,
      columnOffset + offset.column,
      stopLine,
      stopColumn,
    );
  }
}

function addSection(
  input: Section['map'],
  mapUrl: string | null | undefined,
  mappings: SourceMapSegment[][],
  sources: string[],
  sourcesContent: (string | null)[],
  names: string[],
  lineOffset: number,
  columnOffset: number,
  stopLine: number,
  stopColumn: number,
) {
  if ('sections' in input) return recurse(...(arguments as unknown as Parameters<typeof recurse>));

  const map = AnyMap(input, mapUrl);
  const sourcesOffset = sources.length;
  const namesOffset = names.length;
  const decoded = decodedMappings(map);
  const { resolvedSources } = map;
  append(sources, resolvedSources);
  append(sourcesContent, map.sourcesContent || fillSourcesContent(resolvedSources.length));
  append(names, map.names);

  // If this section jumps forwards several lines, we need to add lines to the output mappings catch up.
  for (let i = mappings.length; i <= lineOffset; i++) mappings.push([]);

  for (let i = 0; i < decoded.length; i++) {
    const lineI = lineOffset + i;

    // We can only add so many lines before we step into the range that the next section's map
    // controls. When we get to the last line, then we'll start checking the segments to see if
    // they've crossed into the column range. But it may not have any columns that overstep, so we
    // still need to check that we don't overstep lines, too.
    if (lineI > stopLine) return;

    // On the 0th loop, the line will already exist due to a previous section, or the line catch up
    // loop above.
    const out = i === 0 ? mappings[lineI] : (mappings[lineI] = []);
    // On the 0th loop, the section's column offset shifts us forward. On all other lines (since the
    // map can be multiple lines), it doesn't.
    const cOffset = i === 0 ? columnOffset : 0;

    const line = decoded[i];
    for (let j = 0; j < line.length; j++) {
      const seg = line[j];
      const column = cOffset + seg[COLUMN];

      // If this segment steps into the column range that the next section's map controls, we need
      // to stop early.
      if (lineI === stopLine && column >= stopColumn) return;

      if (seg.length === 1) {
        out.push([column]);
        continue;
      }

      const sourcesIndex = sourcesOffset + seg[SOURCES_INDEX];
      const sourceLine = seg[SOURCE_LINE];
      const sourceColumn = seg[SOURCE_COLUMN];
      if (seg.length === 4) {
        out.push([column, sourcesIndex, sourceLine, sourceColumn]);
        continue;
      }

      out.push([column, sourcesIndex, sourceLine, sourceColumn, namesOffset + seg[NAMES_INDEX]]);
    }
  }
}

function append<T>(arr: T[], other: T[]) {
  for (let i = 0; i < other.length; i++) arr.push(other[i]);
}

// Sourcemaps don't need to have sourcesContent, and if they don't, we need to create an array of
// equal length to the sources. This is because the sources and sourcesContent are paired arrays,
// where `sourcesContent[i]` is the content of the `sources[i]` file. If we didn't, then joined
// sourcemap would desynchronize the sources/contents.
function fillSourcesContent(len: number): null[] {
  const sourcesContent = [];
  for (let i = 0; i < len; i++) sourcesContent[i] = null;
  return sourcesContent;
}
