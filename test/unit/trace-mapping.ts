import { encode } from 'sourcemap-codec';

import { test, describe } from '../setup';
import TraceMap from '../../src/trace-mapping';

import type { SourceMapInput, EncodedSourceMap, DecodedSourceMap } from '../../src/trace-mapping';

describe('TraceMap', () => {
  const decodedMap: DecodedSourceMap = {
    version: 3,
    sources: ['input.js'],
    sourceRoot:
      'https://astexplorer.net/#/gist/d91f04e37e8e12eec06f2886e6bc3a4d/56cd06cd895d3b638b4100658b0027787ca5e5f1',
    names: ['foo', 'bar', 'Error'],
    mappings: [
      [
        [0, 0, 0, 0],
        [9, 0, 0, 9, 0],
        [12, 0, 0, 0],
        [13, 0, 0, 13, 1],
        [16, 0, 0, 0],
        [18, 0, 0, 33],
      ],
      [
        [0, 0, 1, 4],
        [8, 0, 1, 10],
        [12, 0, 1, 14, 2],
        [17, 0, 1, 10],
        [18, 0, 1, 20],
        [32, 0, 1, 10],
        [33, 0, 1, 4],
      ],
      [[0, 0, 2, 1]],
      [],
      [
        [0, 0, 3, 0, 0],
        [3, 0, 3, 3],
      ],
    ],
    sourcesContent: [
      "function foo(bar: number): never {\n    throw new Error('Intentional.');\n}\nfoo();",
    ],
  };
  const encodedMap: EncodedSourceMap = {
    ...decodedMap,
    mappings: encode(decodedMap.mappings),
  };

  function testSuite(map: SourceMapInput) {
    return () => {
      describe('map properties', () => {
        test('version', (t) => {
          const tracer = TraceMap(map);
          t.is(tracer.version, decodedMap.version);
        });

        test('file', (t) => {
          const tracer = TraceMap(map);
          t.is(tracer.file, decodedMap.file);
        });

        test('sourceRoot', (t) => {
          const tracer = TraceMap(map);
          t.is(tracer.sourceRoot, decodedMap.sourceRoot);
        });

        test('sources', (t) => {
          const tracer = TraceMap(map);
          t.deepEqual(tracer.sources, decodedMap.sources);
        });

        test('names', (t) => {
          const tracer = TraceMap(map);
          t.deepEqual(tracer.names, decodedMap.names);
        });

        test('encodedMappings', (t) => {
          const tracer = TraceMap(map);
          t.is(tracer.encodedMappings, encodedMap.mappings);
        });

        test('decodedMappings', (t) => {
          const tracer = TraceMap(map);
          t.deepEqual(tracer.decodedMappings, decodedMap.mappings);
        });

        test('sourcesContent', (t) => {
          const tracer = TraceMap(map);
          t.deepEqual(tracer.sourcesContent, decodedMap.sourcesContent);
        });
      });

      test('traceSegment', (t) => {
        const { mappings } = decodedMap;
        const tracer = TraceMap(map);

        for (let line = 0; line < mappings.length; line++) {
          const segmentLine = mappings[line];

          for (let j = 0; j < segmentLine.length; j++) {
            const segment = segmentLine[j];
            const next = j + 1 < segmentLine.length ? segmentLine[j + 1] : null;
            const nextColumn = next?.[0] ?? segment[0] + 2;

            for (let column = segment[0]; column < nextColumn; column++) {
              const traced = tracer.traceSegment(line, column);
              t.deepEqual(traced, segment, `{ line: ${line}, column: ${column} }`);
            }
          }
        }
      });

      test('originalPositionFor', (t) => {
        const tracer = TraceMap(map);

        t.deepEqual(tracer.originalPositionFor({ line: 2, column: 13 }), {
          source: 'https://astexplorer.net/input.js',
          line: 2,
          column: 14,
          name: 'Error',
        });

        t.deepEqual(tracer.originalPositionFor({ line: 100, column: 13 }), {
          source: null,
          line: null,
          column: null,
          name: null,
        });

        t.throws(() => {
          tracer.originalPositionFor({ line: 0, column: 13 });
        });

        t.throws(() => {
          tracer.originalPositionFor({ line: 1, column: -1 });
        });
      });
    };
  }

  describe('decoded source map', testSuite(decodedMap));
  describe('json decoded source map', testSuite(JSON.stringify(decodedMap)));
  describe('encoded source map', testSuite(encodedMap));
  describe('json encoded source map', testSuite(JSON.stringify(encodedMap)));
});
