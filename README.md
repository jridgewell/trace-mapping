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

## Benchmarks

`trace-mapping` is the fastest source map tracing library, by a factor of 4-5x when
constructing/parsing source maps and another 4-5x when using `originalPositionFor` on an already
constructed instance.

```
node v16.13.2

trace-mapping: encoded JSON input x 457 ops/sec ±0.61% (91 runs sampled)
trace-mapping: decoded JSON input x 202 ops/sec ±0.33% (87 runs sampled)
trace-mapping: encoded Object input x 540 ops/sec ±0.42% (87 runs sampled)
trace-mapping: decoded Object input x 3,400 ops/sec ±0.09% (100 runs sampled)
source-map-js: decoded Object input x 93.64 ops/sec ±2.53% (72 runs sampled)
source-map:    decoded Object input x 38.29 ops/sec ±4.39% (52 runs sampled)
Fastest is trace-mapping: decoded Object input

trace-mapping: Encoded originalPositionFor x 103 ops/sec ±0.53% (77 runs sampled)
trace-mapping: Decoded originalPositionFor x 72.76 ops/sec ±0.14% (76 runs sampled)
source-map-js: originalPositionFor x 24.56 ops/sec ±1.27% (45 runs sampled)
source-map:    originalPositionFor x 21.29 ops/sec ±1.40% (40 runs sampled)
Fastest is trace-mapping: Encoded originalPositionFor
```

[source-map]: https://www.npmjs.com/package/source-map
