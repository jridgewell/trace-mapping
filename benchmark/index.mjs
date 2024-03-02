/* eslint-env node */

import { readdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, relative } from 'path';
import Benchmark from 'benchmark';
import { decode } from '@jridgewell/sourcemap-codec';
import {
  TraceMap as CurrentTraceMap,
  originalPositionFor as currentOriginalPositionFor,
} from '../dist/trace-mapping.mjs';
import {
  TraceMap as LatestTraceMap,
  originalPositionFor as latestOriginalPositionFor,
} from '../dist/trace-mapping.mjs';
import { SourceMapConsumer as SourceMapConsumerJs } from 'source-map-js';
import { SourceMapConsumer as SourceMapConsumer061 } from 'source-map';
import { SourceMapConsumer as SourceMapConsumerWasm } from 'source-map-wasm';

const dir = relative(process.cwd(), dirname(fileURLToPath(import.meta.url)));
const diff = !!process.env.DIFF;

console.log(`node ${process.version}\n`);

async function track(label, results, cb) {
  if (global.gc) global.gc();
  const before = process.memoryUsage();
  const ret = await cb();
  const after = process.memoryUsage();
  const d = delta(before, after);
  console.log(
    `${label.padEnd(25, ' ')} ${String(d.heapUsed + d.external).padStart(10, ' ')} bytes`,
  );
  results.push({ label, delta: d.heapUsed + d.external });
  return ret;
}

function delta(before, after) {
  return {
    rss: after.rss - before.rss,
    heapTotal: after.heapTotal - before.heapTotal,
    heapUsed: after.heapUsed - before.heapUsed,
    external: after.external - before.external,
    arrayBuffers: after.arrayBuffers - before.arrayBuffers,
  };
}

async function bench(file) {
  const map = JSON.parse(readFileSync(join(dir, file)));
  const encodedMapData = map;
  const encodedMapDataJson = JSON.stringify(map);
  const decodedMapData = { ...map, mappings: decode(map.mappings) };
  const decodedMapDataJson = JSON.stringify(decodedMapData);

  const lines = decodedMapData.mappings;
  const segments = lines.reduce((cur, line) => {
    return cur + line.length;
  }, 0);
  console.log(file, `- ${segments} segments`);
  console.log('');

  console.log('Memory Usage:');
  const results = [];
  let benchmark,
    currentDecoded,
    currentEncoded,
    latestDecoded,
    latestEncoded,
    smcjs,
    smc061,
    smcWasm;
  currentDecoded = await track('trace-mapping decoded', results, () => {
    const decoded = new CurrentTraceMap(decodedMapData);
    currentOriginalPositionFor(decoded, { line: 1, column: 0 });
    return decoded;
  });
  currentEncoded = await track('trace-mapping encoded', results, () => {
    const encoded = new CurrentTraceMap(encodedMapData);
    currentOriginalPositionFor(encoded, { line: 1, column: 0 });
    return encoded;
  });
  if (diff) {
    latestDecoded = await track('trace-mapping latest decoded', results, () => {
      const decoded = new LatestTraceMap(decodedMapData);
      currentOriginalPositionFor(decoded, { line: 1, column: 0 });
      return decoded;
    });
    latestEncoded = await track('trace-mapping latest encoded', results, () => {
      const encoded = new LatestTraceMap(encodedMapData);
      currentOriginalPositionFor(encoded, { line: 1, column: 0 });
      return encoded;
    });
  } else {
    smcjs = await track('source-map-js', results, () => {
      const smcjs = new SourceMapConsumerJs(encodedMapData);
      smcjs.originalPositionFor({ line: 1, column: 0 });
      return smcjs;
    });
    smc061 = await track('source-map-0.6.1', results, () => {
      const smc061 = new SourceMapConsumer061(encodedMapData);
      smc061.originalPositionFor({ line: 1, column: 0 });
      return smc061;
    });
    smcWasm = await track('source-map-0.8.0', results, async () => {
      const smcWasm = await new SourceMapConsumerWasm(encodedMapData);
      smcWasm.originalPositionFor({ line: 1, column: 0 });
      return smcWasm;
    });
  }
  const winner = results.reduce((min, cur) => {
    if (cur.delta < min.delta) return cur;
    return min;
  });
  console.log(`Smallest memory usage is ${winner.label}`);

  console.log('');

  console.log('Init speed:');
  benchmark = new Benchmark.Suite()
    .add('trace-mapping:    decoded JSON input', () => {
      currentOriginalPositionFor(new CurrentTraceMap(decodedMapDataJson), { line: 1, column: 0 });
    })
    .add('trace-mapping:    encoded JSON input', () => {
      currentOriginalPositionFor(new CurrentTraceMap(encodedMapDataJson), { line: 1, column: 0 });
    });
  if (diff) {
    benchmark
      .add('trace-mapping latest:    decoded JSON input', () => {
        latestOriginalPositionFor(new LatestTraceMap(decodedMapDataJson), { line: 1, column: 0 });
      })
      .add('trace-mapping latest:    encoded JSON input', () => {
        latestOriginalPositionFor(new LatestTraceMap(encodedMapDataJson), { line: 1, column: 0 });
      });
  } else {
    benchmark
      .add('trace-mapping:    decoded Object input', () => {
        currentOriginalPositionFor(new CurrentTraceMap(decodedMapData), { line: 1, column: 0 });
      })
      .add('trace-mapping:    encoded Object input', () => {
        currentOriginalPositionFor(new CurrentTraceMap(encodedMapData), { line: 1, column: 0 });
      })
      .add('source-map-js:    encoded Object input', () => {
        new SourceMapConsumerJs(encodedMapData).originalPositionFor({ line: 1, column: 0 });
      })
      .add('source-map-0.6.1: encoded Object input', () => {
        new SourceMapConsumer061(encodedMapData).originalPositionFor({ line: 1, column: 0 });
      });
    // WASM isn't tested because its async and OOMs.
    // .add('source-map-0.8.0: encoded Object input', () => { })
  }
  benchmark
    // add listeners
    .on('error', (event) => console.error(event.target.error))
    .on('cycle', (event) => {
      console.log(String(event.target));
    })
    .on('complete', function () {
      console.log('Fastest is ' + this.filter('fastest').map('name'));
    })
    .run({});

  console.log('');

  console.log('Trace speed:');
  benchmark = new Benchmark.Suite()
    .add('trace-mapping:    decoded originalPositionFor', () => {
      const i = Math.floor(Math.random() * lines.length);
      const line = lines[i];
      if (line.length === 0) return;
      const j = Math.floor(Math.random() * line.length);
      const column = line[j][0];
      currentOriginalPositionFor(currentDecoded, { line: i + 1, column });
    })
    .add('trace-mapping:    encoded originalPositionFor', () => {
      const i = Math.floor(Math.random() * lines.length);
      const line = lines[i];
      if (line.length === 0) return;
      const j = Math.floor(Math.random() * line.length);
      const column = line[j][0];
      currentOriginalPositionFor(currentEncoded, { line: i + 1, column });
    });
  if (diff) {
    new Benchmark.Suite()
      .add('trace-mapping latest:    decoded originalPositionFor', () => {
        const i = Math.floor(Math.random() * lines.length);
        const line = lines[i];
        if (line.length === 0) return;
        const j = Math.floor(Math.random() * line.length);
        const column = line[j][0];
        latestOriginalPositionFor(latestDecoded, { line: i + 1, column });
      })
      .add('trace-mapping latest:    encoded originalPositionFor', () => {
        const i = Math.floor(Math.random() * lines.length);
        const line = lines[i];
        if (line.length === 0) return;
        const j = Math.floor(Math.random() * line.length);
        const column = line[j][0];
        latestOriginalPositionFor(latestEncoded, { line: i + 1, column });
      });
  } else {
    benchmark
      .add('source-map-js:    encoded originalPositionFor', () => {
        const i = Math.floor(Math.random() * lines.length);
        const line = lines[i];
        if (line.length === 0) return;
        const j = Math.floor(Math.random() * line.length);
        const column = line[j][0];
        smcjs.originalPositionFor({ line: i + 1, column });
      })
      .add('source-map-0.6.1: encoded originalPositionFor', () => {
        const i = Math.floor(Math.random() * lines.length);
        const line = lines[i];
        if (line.length === 0) return;
        const j = Math.floor(Math.random() * line.length);
        const column = line[j][0];
        smc061.originalPositionFor({ line: i + 1, column });
      })
      .add('source-map-0.8.0: encoded originalPositionFor', () => {
        const i = Math.floor(Math.random() * lines.length);
        const line = lines[i];
        if (line.length === 0) return;
        const j = Math.floor(Math.random() * line.length);
        const column = line[j][0];
        smcWasm.originalPositionFor({ line: i + 1, column });
      });
  }

  // add listeners
  benchmark
    .on('error', (event) => console.error(event.target.error))
    .on('cycle', (event) => {
      console.log(String(event.target));
    })
    .on('complete', function () {
      console.log('Fastest is ' + this.filter('fastest').map('name'));
    })
    .run({});

  if (smcWasm) smcWasm.destroy();
}

async function run(files) {
  let first = true;
  for (const file of files) {
    if (!file.endsWith('.map')) continue;

    if (!first) console.log('\n\n***\n\n');
    first = false;

    await bench(file);
  }
}
run(readdirSync(dir));
