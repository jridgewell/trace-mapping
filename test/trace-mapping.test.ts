/// <reference lib="esnext" />

import { encode, decode } from '@jridgewell/sourcemap-codec';

import { test, describe } from './setup';
import {
  TraceMap,
  encodedMappings,
  decodedMappings,
  traceSegment,
  originalPositionFor,
} from '../src/trace-mapping';

import type { ExecutionContext } from 'ava';
import type { SourceMapInput, EncodedSourceMap, DecodedSourceMap } from '../src/trace-mapping';

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
        [4, 0, 1, 4],
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
  function replaceField(
    map: SourceMapInput,
    field: keyof (DecodedSourceMap | EncodedSourceMap),
    value: any,
  ): SourceMapInput {
    if (typeof map !== 'string') {
      return {
        ...map,
        [field]: value,
      };
    }

    map = JSON.parse(map);
    (map as any)[field] = value;
    return JSON.stringify(map);
  }

  function testSuite(map: SourceMapInput) {
    return () => {
      describe('map properties', () => {
        test('version', (t) => {
          const tracer = new TraceMap(map);
          t.is(tracer.version, decodedMap.version);
        });

        test('file', (t) => {
          const tracer = new TraceMap(map);
          t.is(tracer.file, decodedMap.file);
        });

        test('sourceRoot', (t) => {
          const tracer = new TraceMap(map);
          t.is(tracer.sourceRoot, decodedMap.sourceRoot);
        });

        test('sources', (t) => {
          const tracer = new TraceMap(map);
          t.deepEqual(tracer.sources, decodedMap.sources);
        });

        test('names', (t) => {
          const tracer = new TraceMap(map);
          t.deepEqual(tracer.names, decodedMap.names);
        });

        test('encodedMappings', (t) => {
          const tracer = new TraceMap(map);
          t.is(encodedMappings(tracer), encodedMap.mappings);
        });

        test('decodedMappings', (t) => {
          const tracer = new TraceMap(map);
          t.deepEqual(decodedMappings(tracer), decodedMap.mappings);
        });

        test('sourcesContent', (t) => {
          const tracer = new TraceMap(map);
          t.deepEqual(tracer.sourcesContent, decodedMap.sourcesContent);
        });

        describe('resolvedSources', () => {
          test('unresolved without sourceRoot', (t) => {
            const tracer = new TraceMap(replaceField(map, 'sourceRoot', undefined));
            t.deepEqual(tracer.resolvedSources, ['input.js']);
          });

          test('relative to mapUrl', (t) => {
            const tracer = new TraceMap(
              replaceField(map, 'sourceRoot', undefined),
              'foo/script.js.map',
            );
            t.deepEqual(tracer.resolvedSources, ['foo/input.js']);
          });

          test('relative to sourceRoot', (t) => {
            const tracer = new TraceMap(replaceField(map, 'sourceRoot', 'foo'));
            t.deepEqual(tracer.resolvedSources, ['foo/input.js']);
          });

          test('relative to mapUrl then sourceRoot', (t) => {
            const tracer = new TraceMap(
              replaceField(map, 'sourceRoot', 'bar'),
              'foo/script.js.map',
            );
            t.deepEqual(tracer.resolvedSources, ['foo/bar/input.js']);
          });
        });
      });

      test('traceSegment', (t) => {
        const { mappings } = decodedMap;
        const tracer = new TraceMap(map);

        // This comes before any segment on line 2, but importantly there are segments on line 1. If
        // binary searchign returns the last segment of line 1, we've failed.
        t.is(traceSegment(tracer, 1, 0), null);

        for (let line = 0; line < mappings.length; line++) {
          const segmentLine = mappings[line];

          for (let j = 0; j < segmentLine.length; j++) {
            const segment = segmentLine[j];
            const next = j + 1 < segmentLine.length ? segmentLine[j + 1] : null;
            const nextColumn = next?.[0] ?? segment[0] + 2;

            for (let column = segment[0]; column < nextColumn; column++) {
              const traced = traceSegment(tracer, line, column);
              t.deepEqual(traced, segment, `{ line: ${line}, column: ${column} }`);
            }
          }
        }
      });

      test('originalPositionFor', (t) => {
        const tracer = new TraceMap(map);

        t.deepEqual(originalPositionFor(tracer, { line: 2, column: 13 }), {
          source: 'https://astexplorer.net/input.js',
          line: 2,
          column: 14,
          name: 'Error',
        });

        t.deepEqual(originalPositionFor(tracer, { line: 100, column: 13 }), {
          source: null,
          line: null,
          column: null,
          name: null,
        });

        t.throws(() => {
          originalPositionFor(tracer, { line: 0, column: 13 });
        });

        t.throws(() => {
          originalPositionFor(tracer, { line: 1, column: -1 });
        });
      });
    };
  }

  describe('decoded source map', testSuite(decodedMap));
  describe('json decoded source map', testSuite(JSON.stringify(decodedMap)));
  describe('encoded source map', testSuite(encodedMap));
  describe('json encoded source map', testSuite(JSON.stringify(encodedMap)));

  describe('unordered mappings', () => {
    const mappings = decodedMap.mappings.map((line) => {
      return line.slice().reverse();
    });
    const reversedDecoded: DecodedSourceMap = {
      ...decodedMap,
      mappings,
    };
    const reversedEncoded: EncodedSourceMap = {
      ...encodedMap,
      mappings: encode(mappings),
    };
    const macro = test.macro((t: ExecutionContext<unknown>, map: SourceMapInput) => {
      const tracer = new TraceMap(map);
      t.deepEqual(decodedMappings(tracer), decodedMap.mappings);
    });

    test('decoded source map', macro, reversedDecoded);
    test('json decoded source map', macro, JSON.stringify(reversedDecoded));
    test('encoded source map', macro, reversedEncoded);
    test('json encoded source map', macro, JSON.stringify(reversedEncoded));
  });

  describe('empty mappings with lines', () => {
    const decoded: DecodedSourceMap = {
      ...decodedMap,
      mappings: decode(';;;;;;;;;;;;;;;;'),
    };
    const encoded: EncodedSourceMap = {
      ...encodedMap,
      mappings: ';;;;;;;;;;;;;;;;',
    };

    const macro = test.macro((t: ExecutionContext<unknown>, map: SourceMapInput) => {
      const tracer = new TraceMap(map);
      for (let i = 0; i < decoded.mappings.length; i++) {
        t.is(traceSegment(tracer, i, 0), null, `{ line: ${i} }`);
      }
    });

    test('decoded source map', macro, decoded);
    test('json decoded source map', macro, JSON.stringify(decoded));
    test('encoded source map', macro, encoded);
    test('json encoded source map', macro, JSON.stringify(encoded));
  });
});
