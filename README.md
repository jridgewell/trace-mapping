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

trace-mapping: decoded JSON input x 3,673 ops/sec ±0.52% (99 runs sampled)
trace-mapping: encoded JSON input x 13,043 ops/sec ±0.92% (94 runs sampled)
trace-mapping: decoded Object input x 98,660 ops/sec ±0.30% (98 runs sampled)
trace-mapping: encoded Object input x 14,255 ops/sec ±0.90% (93 runs sampled)
source-map-js: encoded Object input x 3,119 ops/sec ±0.18% (99 runs sampled)
source-map:    encoded Object input x 1,227 ops/sec ±0.87% (96 runs sampled)
Fastest is trace-mapping: decoded Object input

trace-mapping: decoded originalPositionFor x 7,905 ops/sec ±0.68% (101 runs sampled)
trace-mapping: encoded originalPositionFor x 5,622 ops/sec ±0.12% (101 runs sampled)
source-map-js: encoded originalPositionFor x 1,419 ops/sec ±0.65% (97 runs sampled)
source-map:    encoded originalPositionFor x 791 ops/sec ±0.76% (97 runs sampled)
Fastest is trace-mapping: decoded originalPositionFor
```

[source-map]: https://www.npmjs.com/package/source-map
