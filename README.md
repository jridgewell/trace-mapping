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
trace-mapping decoded         414788 bytes
trace-mapping encoded        6280096 bytes
source-map-js               10788968 bytes
source-map-0.6.1            17665560 bytes
source-map-0.8.0             8754851 bytes
Chrome dev tools             8765264 bytes
Smallest memory usage is trace-mapping decoded

Init speed:
trace-mapping:    decoded JSON input x 206 ops/sec ±0.36% (88 runs sampled)
trace-mapping:    encoded JSON input x 404 ops/sec ±1.65% (84 runs sampled)
trace-mapping:    decoded Object input x 4,647 ops/sec ±0.12% (97 runs sampled)
trace-mapping:    encoded Object input x 453 ops/sec ±1.73% (76 runs sampled)
source-map-js:    encoded Object input x 77.10 ops/sec ±1.45% (68 runs sampled)
source-map-0.6.1: encoded Object input x 39.01 ops/sec ±1.97% (53 runs sampled)
Chrome dev tools: encoded Object input x 150 ops/sec ±1.60% (79 runs sampled)
Fastest is trace-mapping:    decoded Object input

Trace speed:
trace-mapping:    decoded originalPositionFor x 3,998,025 ops/sec ±0.37% (100 runs sampled)
trace-mapping:    encoded originalPositionFor x 3,289,465 ops/sec ±1.79% (92 runs sampled)
source-map-js:    encoded originalPositionFor x 917,842 ops/sec ±1.07% (91 runs sampled)
source-map-0.6.1: encoded originalPositionFor x 785,105 ops/sec ±1.17% (97 runs sampled)
source-map-0.8.0: encoded originalPositionFor x 2,745,332 ops/sec ±0.91% (97 runs sampled)
Chrome dev tools: encoded originalPositionFor x 4,287,614 ops/sec ±1.20% (91 runs sampled)
Fastest is Chrome dev tools: encoded originalPositionFor


***


babel.min.js.map - 347793 segments

Memory Usage:
trace-mapping decoded          26704 bytes
trace-mapping encoded       35430936 bytes
source-map-js               51644904 bytes
source-map-0.6.1            63528632 bytes
source-map-0.8.0            43147288 bytes
Chrome dev tools            50911744 bytes
Smallest memory usage is trace-mapping decoded

Init speed:
trace-mapping:    decoded JSON input x 17.86 ops/sec ±6.05% (34 runs sampled)
trace-mapping:    encoded JSON input x 30.95 ops/sec ±8.70% (43 runs sampled)
trace-mapping:    decoded Object input x 791 ops/sec ±1.02% (93 runs sampled)
trace-mapping:    encoded Object input x 33.02 ops/sec ±8.84% (45 runs sampled)
source-map-js:    encoded Object input x 6.54 ops/sec ±4.17% (21 runs sampled)
source-map-0.6.1: encoded Object input x 4.26 ops/sec ±4.84% (15 runs sampled)
Chrome dev tools: encoded Object input x 22.13 ops/sec ±3.07% (41 runs sampled)
Fastest is trace-mapping:    decoded Object input

Trace speed:
trace-mapping:    decoded originalPositionFor x 8,287,155 ops/sec ±1.61% (89 runs sampled)
trace-mapping:    encoded originalPositionFor x 5,707,321 ops/sec ±1.64% (93 runs sampled)
source-map-js:    encoded originalPositionFor x 4,617,011 ops/sec ±0.89% (96 runs sampled)
source-map-0.6.1: encoded originalPositionFor x 4,003,422 ops/sec ±1.03% (93 runs sampled)
source-map-0.8.0: encoded originalPositionFor x 6,823,856 ops/sec ±1.07% (93 runs sampled)
Chrome dev tools: encoded originalPositionFor x 7,558,852 ops/sec ±0.96% (94 runs sampled)
Fastest is trace-mapping:    decoded originalPositionFor


***


preact.js.map - 1992 segments

Memory Usage:
trace-mapping decoded          41920 bytes
trace-mapping encoded         254336 bytes
source-map-js                 954752 bytes
source-map-0.6.1             1160040 bytes
source-map-0.8.0               65096 bytes
Chrome dev tools              398792 bytes
Smallest memory usage is trace-mapping decoded

Init speed:
trace-mapping:    decoded JSON input x 3,726 ops/sec ±0.13% (99 runs sampled)
trace-mapping:    encoded JSON input x 6,452 ops/sec ±0.25% (100 runs sampled)
trace-mapping:    decoded Object input x 83,383 ops/sec ±0.19% (99 runs sampled)
trace-mapping:    encoded Object input x 14,961 ops/sec ±0.25% (97 runs sampled)
source-map-js:    encoded Object input x 2,539 ops/sec ±0.24% (98 runs sampled)
source-map-0.6.1: encoded Object input x 1,237 ops/sec ±0.50% (97 runs sampled)
Chrome dev tools: encoded Object input x 4,128 ops/sec ±0.47% (90 runs sampled)
Fastest is trace-mapping:    decoded Object input

Trace speed:
trace-mapping:    decoded originalPositionFor x 7,860,922 ops/sec ±0.13% (99 runs sampled)
trace-mapping:    encoded originalPositionFor x 7,194,603 ops/sec ±0.22% (98 runs sampled)
source-map-js:    encoded originalPositionFor x 2,653,667 ops/sec ±0.27% (97 runs sampled)
source-map-0.6.1: encoded originalPositionFor x 1,794,160 ops/sec ±0.33% (100 runs sampled)
source-map-0.8.0: encoded originalPositionFor x 4,079,232 ops/sec ±0.35% (98 runs sampled)
Chrome dev tools: encoded originalPositionFor x 8,502,450 ops/sec ±0.35% (98 runs sampled)
Fastest is Chrome dev tools: encoded originalPositionFor


***


react.js.map - 5726 segments

Memory Usage:
trace-mapping decoded          13464 bytes
trace-mapping encoded         682000 bytes
source-map-js                2540984 bytes
source-map-0.6.1             2230384 bytes
source-map-0.8.0              230432 bytes
Chrome dev tools             1118400 bytes
Smallest memory usage is trace-mapping decoded

Init speed:
trace-mapping:    decoded JSON input x 1,902 ops/sec ±0.13% (100 runs sampled)
trace-mapping:    encoded JSON input x 4,763 ops/sec ±0.34% (100 runs sampled)
trace-mapping:    decoded Object input x 75,303 ops/sec ±0.22% (100 runs sampled)
trace-mapping:    encoded Object input x 5,791 ops/sec ±0.23% (100 runs sampled)
source-map-js:    encoded Object input x 811 ops/sec ±0.19% (96 runs sampled)
source-map-0.6.1: encoded Object input x 420 ops/sec ±0.56% (93 runs sampled)
Chrome dev tools: encoded Object input x 1,503 ops/sec ±0.46% (94 runs sampled)
Fastest is trace-mapping:    decoded Object input

Trace speed:
trace-mapping:    decoded originalPositionFor x 34,044,182 ops/sec ±0.23% (95 runs sampled)
trace-mapping:    encoded originalPositionFor x 34,822,726 ops/sec ±0.47% (97 runs sampled)
source-map-js:    encoded originalPositionFor x 16,094,195 ops/sec ±3.07% (87 runs sampled)
source-map-0.6.1: encoded originalPositionFor x 12,818,718 ops/sec ±1.90% (92 runs sampled)
source-map-0.8.0: encoded originalPositionFor x 24,418,865 ops/sec ±0.36% (98 runs sampled)
Chrome dev tools: encoded originalPositionFor x 39,636,843 ops/sec ±0.37% (96 runs sampled)
Fastest is Chrome dev tools: encoded originalPositionFor


***


vscode.map - 2141001 segments

Memory Usage:
trace-mapping decoded        4983728 bytes
trace-mapping encoded      200000064 bytes
source-map-js              278356960 bytes
source-map-0.6.1           397326704 bytes
source-map-0.8.0           243384784 bytes
Chrome dev tools           255377536 bytes
Smallest memory usage is trace-mapping decoded

Init speed:
trace-mapping:    decoded JSON input x 1.81 ops/sec ±20.81% (9 runs sampled)
trace-mapping:    encoded JSON input x 2.14 ops/sec ±36.01% (10 runs sampled)
trace-mapping:    decoded Object input x 103 ops/sec ±0.54% (77 runs sampled)
trace-mapping:    encoded Object input x 3.35 ops/sec ±25.98% (12 runs sampled)
source-map-js:    encoded Object input x 1.08 ops/sec ±12.75% (7 runs sampled)
source-map-0.6.1: encoded Object input x 0.54 ops/sec ±13.02% (6 runs sampled)
Chrome dev tools: encoded Object input x 2.75 ops/sec ±17.79% (12 runs sampled)
Fastest is trace-mapping:    decoded Object input

Trace speed:
trace-mapping:    decoded originalPositionFor x 7,276,996 ops/sec ±1.38% (90 runs sampled)
trace-mapping:    encoded originalPositionFor x 4,717,088 ops/sec ±1.53% (89 runs sampled)
source-map-js:    encoded originalPositionFor x 1,547,423 ops/sec ±0.91% (97 runs sampled)
source-map-0.6.1: encoded originalPositionFor x 1,453,214 ops/sec ±1.39% (93 runs sampled)
source-map-0.8.0: encoded originalPositionFor x 4,077,080 ops/sec ±0.90% (89 runs sampled)
Chrome dev tools: encoded originalPositionFor x 5,096,269 ops/sec ±0.98% (92 runs sampled)
Fastest is trace-mapping:    decoded originalPositionFor
```

[source-map]: https://www.npmjs.com/package/source-map
