import { AnyMap, originalPositionFor } from './dist/trace-mapping.mjs';
import assert from 'assert';

const sectioned = new AnyMap({
  version: 3,
  sections: [
    {
      // 0-base line and column
      offset: { line: 0, column: 0 },
      map: {
        version: 3,
        sources: ['input.js'],
        names: ['foo'],
        mappings: 'KAyCIA',
      },
    },
    {
      offset: { line: 1, column: 0 },
      map: {
        version: 3,
        sources: ['other.js'],
        names: ['bar'],
        mappings: 'AAAAA',
      },
    },
  ],
});

const traced = originalPositionFor(sectioned, {
  line: 2,
  column: 0,
});

assert.deepEqual(traced, {
  source: 'other.js',
  line: 1,
  column: 0,
  name: 'bar',
});
