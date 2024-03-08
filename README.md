# @jridgewell/trace-mapping

> Trace the original position through a source map

`trace-mapping` allows you to take the line and column of an output file and trace it to the
original location in the source file through a source map.

You may already be familiar with the [`source-map`][source-map] package's `SourceMapConsumer`. This
provides the same `originalPositionFor` and `generatedPositionFor` API, without requiring WASM.

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
  sourceContentFor,
  isIgnored,
} from '@jridgewell/trace-mapping';

const tracer = new TraceMap({
  version: 3,
  sources: ['input.js'],
  sourcesContent: ['content of input.js'],
  names: ['foo'],
  mappings: 'KAyCIA',
  ignoreList: [],
});

// Lines start at line 1, columns at column 0.
const traced = originalPositionFor(tracer, { line: 1, column: 5 });
assert.deepEqual(traced, {
  source: 'input.js',
  line: 42,
  column: 4,
  name: 'foo',
});

const content = sourceContentFor(tracer, traced.source);
assert.strictEqual(content, 'content for input.js');

const generated = generatedPositionFor(tracer, {
  source: 'input.js',
  line: 42,
  column: 4,
});
assert.deepEqual(generated, {
  line: 1,
  column: 5,
});

const ignored = isIgnored(tracer, 'input.js');
assert.equal(ignored, false);
```

We also provide a lower level API to get the actual segment that matches our line and column. Unlike
`originalPositionFor`, `traceSegment` uses a 0-base for `line`:

```typescript
import { traceSegment } from '@jridgewell/trace-mapping';

// line is 0-base.
const traced = traceSegment(tracer, /* line */ 0, /* column */ 5);

// Segments are [outputColumn, sourcesIndex, sourceLine, sourceColumn, namesIndex]
// Again, line is 0-base and so is sourceLine
assert.deepEqual(traced, [5, 0, 41, 4, 0]);
```

### SectionedSourceMaps

The sourcemap spec defines a special `sections` field that's designed to handle concatenation of
output code with associated sourcemaps. This type of sourcemap is rarely used (no major build tool
produces it), but if you are hand coding a concatenation you may need it. We provide an `AnyMap`
helper that can receive either a regular sourcemap or a `SectionedSourceMap` and returns a
`TraceMap` instance:

```typescript
import { AnyMap } from '@jridgewell/trace-mapping';
const fooOutput = 'foo';
const barOutput = 'bar';
const output = [fooOutput, barOutput].join('\n');

const sectioned = new AnyMap({
  version: 3,
  sections: [
    {
      // 0-base line and column
      offset: { line: 0, column: 0 },
      // fooOutput's sourcemap
      map: {
        version: 3,
        sources: ['foo.js'],
        names: ['foo'],
        mappings: 'AAAAA',
      },
    },
    {
      // barOutput's sourcemap will not affect the first line, only the second
      offset: { line: 1, column: 0 },
      map: {
        version: 3,
        sources: ['bar.js'],
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
  source: 'bar.js',
  line: 1,
  column: 0,
  name: 'bar',
});
```

## Benchmarks

```
node v20.10.0

amp.js.map - 45120 segments

Memory Usage:
trace-mapping decoded         432372 bytes
trace-mapping encoded        6295488 bytes
source-map-js               10795872 bytes
source-map-0.6.1            17667200 bytes
source-map-0.8.0             8742155 bytes
Chrome dev tools             8672888 bytes
Smallest memory usage is trace-mapping decoded

Init speed:
trace-mapping:    decoded JSON input x 204 ops/sec ±0.29% (87 runs sampled)
trace-mapping:    encoded JSON input x 406 ops/sec ±1.53% (88 runs sampled)
source-map-js:    encoded Object input x 76.17 ops/sec ±1.55% (67 runs sampled)
source-map-0.6.1: encoded Object input x 39.15 ops/sec ±2.05% (53 runs sampled)
Chrome dev tools: encoded Object input x 150 ops/sec ±1.70% (78 runs sampled)
Fastest is trace-mapping:    encoded JSON input

Trace speed:
trace-mapping:    decoded originalPositionFor x 4,224,123 ops/sec ±0.40% (98 runs sampled)
trace-mapping:    encoded originalPositionFor x 3,640,822 ops/sec ±1.34% (95 runs sampled)
source-map-js:    encoded originalPositionFor x 919,900 ops/sec ±1.12% (95 runs sampled)
source-map-0.6.1: encoded originalPositionFor x 787,108 ops/sec ±0.75% (93 runs sampled)
source-map-0.8.0: encoded originalPositionFor x 2,708,427 ops/sec ±0.90% (94 runs sampled)
Chrome dev tools: encoded originalPositionFor x 4,372,386 ops/sec ±1.35% (93 runs sampled)
Fastest is Chrome dev tools: encoded originalPositionFor


***


babel.min.js.map - 347793 segments

Memory Usage:
trace-mapping decoded          23704 bytes
trace-mapping encoded       35446872 bytes
source-map-js               51842336 bytes
source-map-0.6.1            63364360 bytes
source-map-0.8.0            43099656 bytes
Chrome dev tools            50854488 bytes
Smallest memory usage is trace-mapping decoded

Init speed:
trace-mapping:    decoded JSON input x 17.90 ops/sec ±5.48% (34 runs sampled)
trace-mapping:    encoded JSON input x 29.84 ops/sec ±9.93% (42 runs sampled)
source-map-js:    encoded Object input x 6.37 ops/sec ±5.98% (21 runs sampled)
source-map-0.6.1: encoded Object input x 4.26 ops/sec ±3.44% (15 runs sampled)
Chrome dev tools: encoded Object input x 22.49 ops/sec ±3.91% (42 runs sampled)
Fastest is trace-mapping:    encoded JSON input

Trace speed:
trace-mapping:    decoded originalPositionFor x 8,754,207 ops/sec ±1.37% (94 runs sampled)
trace-mapping:    encoded originalPositionFor x 6,117,216 ops/sec ±1.17% (96 runs sampled)
source-map-js:    encoded originalPositionFor x 4,642,432 ops/sec ±0.99% (94 runs sampled)
source-map-0.6.1: encoded originalPositionFor x 4,050,880 ops/sec ±0.93% (92 runs sampled)
source-map-0.8.0: encoded originalPositionFor x 6,909,491 ops/sec ±0.85% (94 runs sampled)
Chrome dev tools: encoded originalPositionFor x 7,543,612 ops/sec ±1.28% (93 runs sampled)
Fastest is trace-mapping:    decoded originalPositionFor


***


preact.js.map - 1992 segments

Memory Usage:
trace-mapping decoded          43160 bytes
trace-mapping encoded         254448 bytes
source-map-js                 908816 bytes
source-map-0.6.1             1003896 bytes
source-map-0.8.0               60736 bytes
Chrome dev tools              693280 bytes
Smallest memory usage is trace-mapping decoded

Init speed:
trace-mapping:    decoded JSON input x 3,709 ops/sec ±0.28% (99 runs sampled)
trace-mapping:    encoded JSON input x 6,460 ops/sec ±0.26% (98 runs sampled)
source-map-js:    encoded Object input x 2,550 ops/sec ±0.20% (99 runs sampled)
source-map-0.6.1: encoded Object input x 1,253 ops/sec ±0.23% (98 runs sampled)
Chrome dev tools: encoded Object input x 4,134 ops/sec ±0.39% (90 runs sampled)
Fastest is trace-mapping:    encoded JSON input

Trace speed:
trace-mapping:    decoded originalPositionFor x 8,343,405 ops/sec ±0.21% (97 runs sampled)
trace-mapping:    encoded originalPositionFor x 7,762,166 ops/sec ±1.00% (98 runs sampled)
source-map-js:    encoded originalPositionFor x 2,684,277 ops/sec ±0.18% (100 runs sampled)
source-map-0.6.1: encoded originalPositionFor x 1,806,592 ops/sec ±0.23% (101 runs sampled)
source-map-0.8.0: encoded originalPositionFor x 4,108,393 ops/sec ±0.31% (99 runs sampled)
Chrome dev tools: encoded originalPositionFor x 8,509,258 ops/sec ±0.22% (96 runs sampled)
Fastest is Chrome dev tools: encoded originalPositionFor


***


react.js.map - 5726 segments

Memory Usage:
trace-mapping decoded           6712 bytes
trace-mapping encoded         681584 bytes
source-map-js                2393864 bytes
source-map-0.6.1             2136520 bytes
source-map-0.8.0              137416 bytes
Chrome dev tools             1139480 bytes
Smallest memory usage is trace-mapping decoded

Init speed:
trace-mapping:    decoded JSON input x 1,902 ops/sec ±0.15% (99 runs sampled)
trace-mapping:    encoded JSON input x 4,759 ops/sec ±0.46% (98 runs sampled)
source-map-js:    encoded Object input x 810 ops/sec ±0.24% (96 runs sampled)
source-map-0.6.1: encoded Object input x 433 ops/sec ±0.38% (93 runs sampled)
Chrome dev tools: encoded Object input x 1,579 ops/sec ±0.58% (96 runs sampled)
Fastest is trace-mapping:    encoded JSON input

Trace speed:
trace-mapping:    decoded originalPositionFor x 37,970,548 ops/sec ±0.35% (94 runs sampled)
trace-mapping:    encoded originalPositionFor x 36,277,823 ops/sec ±0.31% (95 runs sampled)
source-map-js:    encoded originalPositionFor x 18,189,770 ops/sec ±0.39% (95 runs sampled)
source-map-0.6.1: encoded originalPositionFor x 13,301,571 ops/sec ±0.37% (100 runs sampled)
source-map-0.8.0: encoded originalPositionFor x 24,284,318 ops/sec ±0.40% (98 runs sampled)
Chrome dev tools: encoded originalPositionFor x 40,156,093 ops/sec ±0.21% (98 runs sampled)
Fastest is Chrome dev tools: encoded originalPositionFor


***


vscode.map - 2141001 segments

Memory Usage:
trace-mapping decoded        4983632 bytes
trace-mapping encoded      200150176 bytes
source-map-js              278285064 bytes
source-map-0.6.1           397452456 bytes
source-map-0.8.0           243363688 bytes
Chrome dev tools           255335712 bytes
Smallest memory usage is trace-mapping decoded

Init speed:
trace-mapping:    decoded JSON input x 1.86 ops/sec ±31.60% (9 runs sampled)
trace-mapping:    encoded JSON input x 2.28 ops/sec ±35.30% (10 runs sampled)
source-map-js:    encoded Object input x 1.14 ops/sec ±5.51% (7 runs sampled)
source-map-0.6.1: encoded Object input x 0.51 ops/sec ±16.65% (6 runs sampled)
Chrome dev tools: encoded Object input x 2.40 ops/sec ±32.11% (12 runs sampled)
Fastest is Chrome dev tools: encoded Object input,trace-mapping:    encoded JSON input,trace-mapping:    decoded JSON input

Trace speed:
trace-mapping:    decoded originalPositionFor x 6,547,243 ops/sec ±1.34% (94 runs sampled)
trace-mapping:    encoded originalPositionFor x 4,831,629 ops/sec ±1.11% (94 runs sampled)
source-map-js:    encoded originalPositionFor x 1,458,787 ops/sec ±0.96% (94 runs sampled)
source-map-0.6.1: encoded originalPositionFor x 1,374,487 ops/sec ±1.01% (91 runs sampled)
source-map-0.8.0: encoded originalPositionFor x 3,438,212 ops/sec ±6.28% (91 runs sampled)
Chrome dev tools: encoded originalPositionFor x 4,605,566 ops/sec ±1.36% (88 runs sampled)
Fastest is trace-mapping:    decoded originalPositionFor
```

[source-map]: https://www.npmjs.com/package/source-map
