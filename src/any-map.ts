import { TraceMap, presortedDecodedMap, decodedMappings } from './trace-mapping';
import {
  COLUMN,
  SOURCES_INDEX,
  SOURCE_LINE,
  SOURCE_COLUMN,
  NAMES_INDEX,
} from './sourcemap-segment';

import type { Section, DecodedSourceMap, SectionedSourceMapInput } from './types';
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
  const { sections } = parsed;

  let i = 0;
  for (; i < sections.length - 1; i++) {
    const no = sections[i + 1].offset;
    addSection(sections[i], mapUrl, mappings, sources, sourcesContent, names, no.line, no.column);
  }
  for (; i < sections.length; i++) {
    addSection(sections[i], mapUrl, mappings, sources, sourcesContent, names, -1, -1);
  }

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

function addSection(
  section: Section,
  mapUrl: string | null | undefined,
  mappings: SourceMapSegment[][],
  sources: string[],
  sourcesContent: (string | null)[],
  names: string[],
  stopLine: number,
  stopColumn: number,
) {
  const { offset, map } = section;
  const { line: lineOffset, column: columnOffset } = offset;

  // If this section jumps forwards several lines, we need to add lines to the output mappings catch up.
  for (let i = mappings.length; i <= lineOffset; i++) mappings.push([]);

  const trace = AnyMap(map, mapUrl);
  const sourcesOffset = sources.length;
  const namesOffset = names.length;
  const decoded = decodedMappings(trace);
  const { resolvedSources } = trace;
  append(sources, resolvedSources);
  append(sourcesContent, trace.sourcesContent || fillSourcesContent(resolvedSources.length));
  append(names, trace.names);

  // We can only add so many lines before we step into the range that the next section's map
  // controls. When we get to the last line, then we'll start checking the segments to see if
  // they've crossed into the column range.
  const len = stopLine === -1 ? decoded.length : Math.min(decoded.length, stopLine + 1);

  for (let i = 0; i < len; i++) {
    const line = decoded[i];
    // On the 0th loop, the line will already exist due to a previous section, or the line catch up
    // loop above.
    const out = i === 0 ? mappings[lineOffset] : (mappings[lineOffset + i] = []);
    // On the 0th loop, the section's column offset shifts us forward. On all other lines (since the
    // map can be multiple lines), it doesn't.
    const cOffset = i === 0 ? columnOffset : 0;

    for (let j = 0; j < line.length; j++) {
      const seg = line[j];
      const column = cOffset + seg[COLUMN];

      // If this segment steps into the column range that the next section's map controls, we need
      // to stop early.
      if (i === stopLine && column >= stopColumn) break;

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
