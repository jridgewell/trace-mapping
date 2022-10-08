/// <reference lib="esnext" />

import { test, describe } from './setup';
import { AnyMap, encodedMappings, decodedMappings } from '../src/trace-mapping';

import type { SectionedSourceMap, SourceMapSegment } from '../src/trace-mapping';

describe('AnyMap', () => {
  const map: SectionedSourceMap = {
    version: 3,
    file: 'sectioned.js',
    sections: [
      {
        offset: { line: 1, column: 1 },
        map: {
          version: 3,
          sections: [
            {
              offset: { line: 0, column: 1 },
              map: {
                version: 3,
                names: ['first'],
                sources: ['first.js'],
                sourcesContent: ['firstsource'],
                mappings: 'AAAAA,CAAC',
              },
            },
            {
              offset: { line: 0, column: 2 },
              map: {
                version: 3,
                names: ['second'],
                sources: ['second.js'],
                sourcesContent: ['secondsource'],
                mappings: 'AAAAA;AAAA',
              },
            },
          ],
        },
      },
      {
        offset: { line: 2, column: 0 },
        map: {
          version: 3,
          sections: [
            {
              offset: { line: 0, column: 0 },
              map: {
                version: 3,
                names: ['third'],
                sources: ['third.js'],
                sourcesContent: ['thirdsource'],
                sourceRoot: 'nested',
                mappings: 'AAAAA,CAAA;AAAA',
              },
            },
            {
              offset: { line: 0, column: 1 },
              map: {
                version: 3,
                names: [],
                sources: ['fourth.js'],
                sourcesContent: ['fourthsource'],
                mappings: 'AAAA',
              },
            },
          ],
        },
      },
    ],
  };

  describe('map properties', () => {
    test('version', (t) => {
      const tracer = new AnyMap(map);
      t.is(tracer.version, map.version);
    });

    test('file', (t) => {
      const tracer = new AnyMap(map);
      t.is(tracer.file, map.file);
    });

    test('sourceRoot', (t) => {
      const tracer = new AnyMap(map);
      t.is(tracer.sourceRoot, undefined);
    });

    test('sources', (t) => {
      const tracer = new AnyMap(map);
      t.deepEqual(tracer.sources, ['first.js', 'second.js', 'nested/third.js', 'fourth.js']);
    });

    test('names', (t) => {
      const tracer = new AnyMap(map);
      t.deepEqual(tracer.names, ['first', 'second', 'third']);
    });

    test('encodedMappings', (t) => {
      const tracer = new AnyMap(map);
      t.is(encodedMappings(tracer), ';EAAAA,CCAAC;ACAAC,CCAA');
    });

    test('decodedMappings', (t) => {
      const tracer = new AnyMap(map);
      t.deepEqual(decodedMappings(tracer), [
        [],
        [
          [2, 0, 0, 0, 0],
          [3, 1, 0, 0, 1],
        ],
        [
          [0, 2, 0, 0, 2],
          [1, 3, 0, 0],
        ],
      ]);
    });

    test('sourcesContent', (t) => {
      const tracer = new AnyMap(map);
      t.deepEqual(tracer.sourcesContent, [
        'firstsource',
        'secondsource',
        'thirdsource',
        'fourthsource',
      ]);
    });
  });

  describe('typescript readonly type', () => {
    test('decoded source map', (t) => {
      // This is a TS lint test, not a real one.
      t.pass();

      const decodedMap = {
        version: 3 as const,
        sources: ['input.js'] as readonly string[],
        names: [] as readonly string[],
        mappings: [] as readonly SourceMapSegment[][],
        sourcesContent: [] as readonly string[],
      };

      new AnyMap(decodedMap);
    });
  });
});
