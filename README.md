# @jridgewell/trace-mapping

> Trace the original position through a source map

`trace-mapping` allows you to take the line and column of an output file and trace it to the
original location in the source file through a source map.

You may already be familiar with the [`source-map`][source-map] package's `SourceMapConsumer`. This
provides the same `originalPositionFor` API, without requires WASM.

## Installation

```sh
npm install @jridgewell/trace-mapping
```

## Usage

```typescript
import { TraceMap } from '@jridgewell/trace-mapping';
// also exported as default.

const tracer = new TraceMap({
  version: 3,
  sources: ['input.js'],
  names: ['foo'],
  mappings: 'KAyCIA',
});

// Lines start at line 1, columns at column 0.
const traced = tracer.originalPositionFor({ line: 1, column: 5 });
assert.deepEqual(traced, {
  source: 'input.js',
  line: 42,
  column: 4,
  name: 'foo',
});
```

We also provide a lower level API to get the actual segment that matches our line and column. Unlike
`originalPositionFor`, `traceSegment` uses a 0-base for `line`:

```typescript
// line is 0-base.
const traced = tracer.originalPositionFor(/* line */ 0, /* column */ 5);

// Segments are [outputColumn, sourcesIndex, sourceLine, sourceColumn, namesIndex]
// Again, line is 0-base and so is sourceLine
assert.deepEqual(traced, [5, 0, 41, 4, 0]);
```

[source-map]: https://www.npmjs.com/package/source-map
