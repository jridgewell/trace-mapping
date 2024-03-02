/// <reference lib="esnext" />

import { strict as assert } from 'assert';
import { FlattenMap, encodedMappings, decodedMappings } from '../src/trace-mapping';

import type { SectionedSourceMap, SourceMapSegment } from '../src/trace-mapping';

describe('FlattenMap', () => {
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
                ignoreList: [0],
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
                mappings: [[[0, 0, 0, 0]]],
                ignoreList: [0],
              },
            },
          ],
        },
      },
    ],
  };

  describe('map properties', () => {
    it('version', () => {
      const tracer = new FlattenMap(map);
      assert.equal(tracer.version, map.version);
    });

    it('file', () => {
      const tracer = new FlattenMap(map);
      assert.equal(tracer.file, map.file);
    });

    it('sourceRoot', () => {
      const tracer = new FlattenMap(map);
      assert.equal(tracer.sourceRoot, undefined);
    });

    it('sources', () => {
      const tracer = new FlattenMap(map);
      assert.deepEqual(tracer.sources, ['first.js', 'second.js', 'nested/third.js', 'fourth.js']);
    });

    it('names', () => {
      const tracer = new FlattenMap(map);
      assert.deepEqual(tracer.names, ['first', 'second', 'third']);
    });

    it('encodedMappings', () => {
      const tracer = new FlattenMap(map);
      assert.equal(encodedMappings(tracer), ';EAAAA,CCAAC;ACAAC,CCAA');
    });

    it('decodedMappings', () => {
      const tracer = new FlattenMap(map);
      assert.deepEqual(decodedMappings(tracer), [
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

    it('sourcesContent', () => {
      const tracer = new FlattenMap(map);
      assert.deepEqual(tracer.sourcesContent, [
        'firstsource',
        'secondsource',
        'thirdsource',
        'fourthsource',
      ]);
    });

    it('ignoreList', () => {
      const tracer = new FlattenMap(map);
      assert.deepEqual(tracer.ignoreList, [0, 3]);
    });
  });

  describe('typescript readonly type', () => {
    it('decoded source map', () => {
      // This is a TS lint test, not a real one.
      const decodedMap = {
        version: 3 as const,
        sources: ['input.js'] as readonly string[],
        names: [] as readonly string[],
        mappings: [] as readonly SourceMapSegment[][],
        sourcesContent: [] as readonly string[],
      };

      new FlattenMap(decodedMap);
    });
  });
});
