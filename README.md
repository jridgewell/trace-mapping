# @jridgewell/trace-mapping

> Trace the original position through a source map

`trace-mapping` allows you to take the line and column of an output file and trace it to the original location in the source file through a source map.

You may already be familiar with the [`source-map`][source-map] package's `SourceMapConsumer`. This provides the same `originalPositionFor` and `generatedPositionFor` API, without requiring WASM.

## Installation

```sh
npm install @jridgewell/trace-mapping
```

## Usage

```typescript
import {
  TraceMap,
  originalPositionFor,
  generatedPositionFor,
} from '@jridgewell/trace-mapping';

const tracer = new TraceMap({
  version: 3,
  sources: ['input.js'],
  names: ['foo'],
  mappings: 'KAyCIA',
});

// Lines start at line 1, columns at column 0.
const traced = originalPositionFor(tracer, { line: 1, column: 5 });
assert.deepEqual(traced, {
  source: 'input.js',
  line: 42,
  column: 4,
  name: 'foo',
});

const generated = generatedPositionFor(tracer, {
  source: 'input.js',
  line: 42,
  column: 4,
});
assert.deepEqual(generated, {
  line: 1,
  column: 5,
});
```

We also provide a lower level API to get the actual segment that matches our line and column. Unlike `originalPositionFor`, `traceSegment` uses a 0-base for `line`:

```typescript
import { traceSegment } from '@jridgewell/trace-mapping';

// line is 0-base.
const traced = traceSegment(tracer, /* line */ 0, /* column */ 5);

// Segments are [outputColumn, sourcesIndex, sourceLine, sourceColumn, namesIndex]
// Again, line is 0-base and so is sourceLine
assert.deepEqual(traced, [5, 0, 41, 4, 0]);
```

## Benchmarks

```
node v16.13.0

amp.js.map
trace-mapping:    decoded JSON input x 41.68 ops/sec ±20.44% (38 runs sampled)
trace-mapping:    encoded JSON input x 32.20 ops/sec ±45.61% (26 runs sampled)
trace-mapping:    decoded Object input x 409 ops/sec ±17.04% (38 runs sampled)
trace-mapping:    encoded Object input x 104 ops/sec ±16.38% (38 runs sampled)
source-map-js:    encoded Object input x 10.78 ops/sec ±25.34% (22 runs sampled)
source-map-0.6.1: encoded Object input x 5.16 ops/sec ±18.91% (18 runs sampled)
Fastest is trace-mapping:    decoded Object input

trace-mapping:    decoded originalPositionFor x 264,268 ops/sec ±14.14% (39 runs sampled)
trace-mapping:    encoded originalPositionFor x 528,134 ops/sec ±11.70% (59 runs sampled)
source-map-js:    encoded originalPositionFor x 273,022 ops/sec ±20.39% (68 runs sampled)
source-map-0.6.1: encoded originalPositionFor x 120,340 ops/sec ±14.28% (41 runs sampled)
source-map-0.7.3: encoded originalPositionFor x 308,158 ops/sec ±11.84% (64 runs sampled)
Fastest is trace-mapping:    encoded originalPositionFor

***

babel.min.js.map
trace-mapping:    decoded JSON input x 5.52 ops/sec ±21.77% (19 runs sampled)
trace-mapping:    encoded JSON input x 10.72 ops/sec ±12.76% (27 runs sampled)
trace-mapping:    decoded Object input x 348 ops/sec ±3.07% (79 runs sampled)
trace-mapping:    encoded Object input x 9.20 ops/sec ±12.19% (20 runs sampled)
source-map-js:    encoded Object input x 3.09 ops/sec ±11.56% (12 runs sampled)
source-map-0.6.1: encoded Object input x 1.74 ops/sec ±14.48% (9 runs sampled)
Fastest is trace-mapping:    decoded Object input

trace-mapping:    decoded originalPositionFor x 2,898,435 ops/sec ±6.37% (76 runs sampled)
trace-mapping:    encoded originalPositionFor x 2,499,183 ops/sec ±4.94% (79 runs sampled)
source-map-js:    encoded originalPositionFor x 141 ops/sec ±195.99% (81 runs sampled)
source-map-0.6.1: encoded originalPositionFor x 127 ops/sec ±195.99% (75 runs sampled)
source-map-0.7.3: encoded originalPositionFor x 2,966,966 ops/sec ±12.73% (83 runs sampled)
Fastest is trace-mapping:    decoded originalPositionFor,source-map-0.7.3: encoded originalPositionFor

***

preact.js.map
trace-mapping:    decoded JSON input x 1,617 ops/sec ±5.57% (79 runs sampled)
trace-mapping:    encoded JSON input x 3,486 ops/sec ±2.94% (87 runs sampled)
trace-mapping:    decoded Object input x 136,226 ops/sec ±5.93% (75 runs sampled)
trace-mapping:    encoded Object input x 7,609 ops/sec ±2.55% (87 runs sampled)
source-map-js:    encoded Object input x 1,271 ops/sec ±7.33% (78 runs sampled)
source-map-0.6.1: encoded Object input x 565 ops/sec ±2.98% (83 runs sampled)
Fastest is trace-mapping:    decoded Object input

trace-mapping:    decoded originalPositionFor x 5,043,368 ops/sec ±5.39% (82 runs sampled)
trace-mapping:    encoded originalPositionFor x 4,278,674 ops/sec ±8.18% (86 runs sampled)
source-map-js:    encoded originalPositionFor x 1,315,722 ops/sec ±8.02% (80 runs sampled)
source-map-0.6.1: encoded originalPositionFor x 748,765 ops/sec ±3.29% (87 runs sampled)
source-map-0.7.3: encoded originalPositionFor x 1,560,329 ops/sec ±3.83% (85 runs sampled)
Fastest is trace-mapping:    decoded originalPositionFor

***

react.js.map
trace-mapping:    decoded JSON input x 788 ops/sec ±4.57% (84 runs sampled)
trace-mapping:    encoded JSON input x 2,117 ops/sec ±3.07% (82 runs sampled)
trace-mapping:    decoded Object input x 38,526 ops/sec ±3.91% (75 runs sampled)
trace-mapping:    encoded Object input x 2,806 ops/sec ±2.80% (88 runs sampled)
source-map-js:    encoded Object input x 387 ops/sec ±12.69% (75 runs sampled)
source-map-0.6.1: encoded Object input x 192 ops/sec ±1.71% (81 runs sampled)
Fastest is trace-mapping:    decoded Object input

trace-mapping:    decoded originalPositionFor x 15,109,060 ops/sec ±6.30% (77 runs sampled)
trace-mapping:    encoded originalPositionFor x 17,028,124 ops/sec ±4.54% (84 runs sampled)
source-map-js:    encoded originalPositionFor x 8,912,348 ops/sec ±6.00% (78 runs sampled)
source-map-0.6.1: encoded originalPositionFor x 6,569,081 ops/sec ±3.61% (82 runs sampled)
source-map-0.7.3: encoded originalPositionFor x 9,004,404 ops/sec ±6.75% (75 runs sampled)
Fastest is trace-mapping:    encoded originalPositionFor
```

[source-map]: https://www.npmjs.com/package/source-map
