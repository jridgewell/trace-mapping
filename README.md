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
trace-mapping decoded         408764 bytes
trace-mapping encoded        6255864 bytes
source-map-js               10797584 bytes
source-map-0.6.1            17620920 bytes
source-map-0.8.0             8732675 bytes
Chrome dev tools             8662896 bytes
Smallest memory usage is trace-mapping decoded

Init speed:
trace-mapping:    decoded JSON input x 201 ops/sec ±0.41% (88 runs sampled)
trace-mapping:    encoded JSON input x 406 ops/sec ±1.36% (91 runs sampled)
trace-mapping:    decoded Object input x 4,609 ops/sec ±0.42% (96 runs sampled)
trace-mapping:    encoded Object input x 456 ops/sec ±1.75% (91 runs sampled)
source-map-js:    encoded Object input x 76.02 ops/sec ±1.58% (67 runs sampled)
source-map-0.6.1: encoded Object input x 39.03 ops/sec ±1.90% (53 runs sampled)
Chrome dev tools: encoded Object input x 150 ops/sec ±1.54% (79 runs sampled)
Fastest is trace-mapping:    decoded Object input

Trace speed:
trace-mapping:    decoded originalPositionFor x 4,228,262 ops/sec ±0.17% (98 runs sampled)
trace-mapping:    encoded originalPositionFor x 3,680,084 ops/sec ±1.82% (93 runs sampled)
source-map-js:    encoded originalPositionFor x 921,915 ops/sec ±0.96% (95 runs sampled)
source-map-0.6.1: encoded originalPositionFor x 790,752 ops/sec ±0.82% (95 runs sampled)
source-map-0.8.0: encoded originalPositionFor x 2,677,373 ops/sec ±1.41% (86 runs sampled)
Chrome dev tools: encoded originalPositionFor x 4,334,343 ops/sec ±1.78% (93 runs sampled)
Fastest is Chrome dev tools: encoded originalPositionFor


***


babel.min.js.map - 347793 segments

Memory Usage:
trace-mapping decoded          10504 bytes
trace-mapping encoded       35459952 bytes
source-map-js               51564824 bytes
source-map-0.6.1            63508912 bytes
source-map-0.8.0            43157632 bytes
Chrome dev tools            50671952 bytes
Smallest memory usage is trace-mapping decoded

Init speed:
trace-mapping:    decoded JSON input x 18.27 ops/sec ±6.27% (34 runs sampled)
trace-mapping:    encoded JSON input x 29.79 ops/sec ±9.90% (45 runs sampled)
trace-mapping:    decoded Object input x 798 ops/sec ±0.81% (95 runs sampled)
trace-mapping:    encoded Object input x 32.48 ops/sec ±8.88% (45 runs sampled)
source-map-js:    encoded Object input x 6.47 ops/sec ±2.84% (20 runs sampled)
source-map-0.6.1: encoded Object input x 4.15 ops/sec ±3.36% (15 runs sampled)
Chrome dev tools: encoded Object input x 22.07 ops/sec ±2.65% (41 runs sampled)
Fastest is trace-mapping:    decoded Object input

Trace speed:
trace-mapping:    decoded originalPositionFor x 8,943,034 ops/sec ±1.10% (93 runs sampled)
trace-mapping:    encoded originalPositionFor x 6,027,882 ops/sec ±1.18% (93 runs sampled)
source-map-js:    encoded originalPositionFor x 4,586,901 ops/sec ±1.22% (91 runs sampled)
source-map-0.6.1: encoded originalPositionFor x 4,109,896 ops/sec ±1.05% (90 runs sampled)
source-map-0.8.0: encoded originalPositionFor x 7,014,752 ops/sec ±0.74% (94 runs sampled)
Chrome dev tools: encoded originalPositionFor x 7,581,293 ops/sec ±1.05% (91 runs sampled)
Fastest is trace-mapping:    decoded originalPositionFor


***


preact.js.map - 1992 segments

Memory Usage:
trace-mapping decoded          34240 bytes
trace-mapping encoded         254240 bytes
source-map-js                 963800 bytes
source-map-0.6.1             1019224 bytes
source-map-0.8.0               62568 bytes
Chrome dev tools              378168 bytes
Smallest memory usage is trace-mapping decoded

Init speed:
trace-mapping:    decoded JSON input x 3,716 ops/sec ±0.20% (100 runs sampled)
trace-mapping:    encoded JSON input x 6,428 ops/sec ±0.33% (98 runs sampled)
trace-mapping:    decoded Object input x 83,753 ops/sec ±0.18% (101 runs sampled)
trace-mapping:    encoded Object input x 15,056 ops/sec ±0.24% (97 runs sampled)
source-map-js:    encoded Object input x 2,531 ops/sec ±0.17% (100 runs sampled)
source-map-0.6.1: encoded Object input x 1,234 ops/sec ±0.52% (96 runs sampled)
Chrome dev tools: encoded Object input x 4,154 ops/sec ±0.54% (92 runs sampled)
Fastest is trace-mapping:    decoded Object input

Trace speed:
trace-mapping:    decoded originalPositionFor x 8,343,993 ops/sec ±0.19% (99 runs sampled)
trace-mapping:    encoded originalPositionFor x 7,806,292 ops/sec ±0.20% (97 runs sampled)
source-map-js:    encoded originalPositionFor x 2,664,544 ops/sec ±0.22% (100 runs sampled)
source-map-0.6.1: encoded originalPositionFor x 1,800,185 ops/sec ±0.23% (100 runs sampled)
source-map-0.8.0: encoded originalPositionFor x 4,149,077 ops/sec ±0.24% (98 runs sampled)
Chrome dev tools: encoded originalPositionFor x 8,486,712 ops/sec ±0.29% (98 runs sampled)
Fastest is Chrome dev tools: encoded originalPositionFor


***


react.js.map - 5726 segments

Memory Usage:
trace-mapping decoded          38216 bytes
trace-mapping encoded         682280 bytes
source-map-js                2392640 bytes
source-map-0.6.1             2057752 bytes
source-map-0.8.0               88568 bytes
Chrome dev tools             1007216 bytes
Smallest memory usage is trace-mapping decoded

Init speed:
trace-mapping:    decoded JSON input x 1,885 ops/sec ±0.31% (97 runs sampled)
trace-mapping:    encoded JSON input x 4,766 ops/sec ±0.25% (99 runs sampled)
trace-mapping:    decoded Object input x 74,702 ops/sec ±0.13% (100 runs sampled)
trace-mapping:    encoded Object input x 5,773 ops/sec ±0.30% (100 runs sampled)
source-map-js:    encoded Object input x 798 ops/sec ±0.24% (98 runs sampled)
source-map-0.6.1: encoded Object input x 417 ops/sec ±0.62% (94 runs sampled)
Chrome dev tools: encoded Object input x 1,538 ops/sec ±0.52% (95 runs sampled)
Fastest is trace-mapping:    decoded Object input

Trace speed:
trace-mapping:    decoded originalPositionFor x 38,046,232 ops/sec ±0.19% (99 runs sampled)
trace-mapping:    encoded originalPositionFor x 35,994,919 ops/sec ±0.35% (97 runs sampled)
source-map-js:    encoded originalPositionFor x 18,004,528 ops/sec ±0.35% (96 runs sampled)
source-map-0.6.1: encoded originalPositionFor x 13,197,850 ops/sec ±0.31% (96 runs sampled)
source-map-0.8.0: encoded originalPositionFor x 24,436,832 ops/sec ±0.35% (100 runs sampled)
Chrome dev tools: encoded originalPositionFor x 40,171,645 ops/sec ±0.25% (97 runs sampled)
Fastest is Chrome dev tools: encoded originalPositionFor


***


vscode.map - 2141001 segments

Memory Usage:
trace-mapping decoded        4983632 bytes
trace-mapping encoded      200191376 bytes
source-map-js              278977256 bytes
source-map-0.6.1           397363784 bytes
source-map-0.8.0           243388360 bytes
Chrome dev tools           255104896 bytes
Smallest memory usage is trace-mapping decoded

Init speed:
trace-mapping:    decoded JSON input x 1.76 ops/sec ±22.68% (9 runs sampled)
trace-mapping:    encoded JSON input x 2.32 ops/sec ±30.42% (10 runs sampled)
trace-mapping:    decoded Object input x 91.05 ops/sec ±0.64% (79 runs sampled)
trace-mapping:    encoded Object input x 2.67 ops/sec ±41.18% (12 runs sampled)
source-map-js:    encoded Object input x 1.07 ops/sec ±14.71% (7 runs sampled)
source-map-0.6.1: encoded Object input x 0.59 ops/sec ±1.71% (6 runs sampled)
Chrome dev tools: encoded Object input x 2.62 ops/sec ±17.68% (11 runs sampled)
Fastest is trace-mapping:    decoded Object input

Trace speed:
trace-mapping:    decoded originalPositionFor x 6,272,053 ops/sec ±1.36% (91 runs sampled)
trace-mapping:    encoded originalPositionFor x 4,773,936 ops/sec ±1.51% (90 runs sampled)
source-map-js:    encoded originalPositionFor x 1,467,541 ops/sec ±1.15% (92 runs sampled)
source-map-0.6.1: encoded originalPositionFor x 1,374,918 ops/sec ±1.55% (91 runs sampled)
source-map-0.8.0: encoded originalPositionFor x 3,655,631 ops/sec ±1.21% (94 runs sampled)
Chrome dev tools: encoded originalPositionFor x 3,815,882 ops/sec ±28.88% (90 runs sampled)
Fastest is trace-mapping:    decoded originalPositionFor
```

[source-map]: https://www.npmjs.com/package/source-map
