/* eslint-env node */

import { readdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, relative } from 'path';
import Benchmark from 'benchmark';
import { decode } from '@jridgewell/sourcemap-codec';
import { TraceMap, originalPositionFor } from '../dist/trace-mapping.mjs';
import { SourceMapConsumer as SourceMapConsumerJs } from 'source-map-js';
import { SourceMapConsumer as SourceMapConsumer061 } from 'source-map';
import { SourceMapConsumer as SourceMapConsumerWasm } from 'source-map-wasm';

const dir = relative(process.cwd(), dirname(fileURLToPath(import.meta.url)));

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
  const decoded = await track('trace-mapping decoded', results, () => {
    const decoded = new TraceMap(decodedMapData);
    originalPositionFor(decoded, { line: 1, column: 0 });
    return decoded;
  });
  const encoded = await track('trace-mapping encoded', results, () => {
    const encoded = new TraceMap(encodedMapData);
    originalPositionFor(encoded, { line: 1, column: 0 });
    return encoded;
  });
  const smcjs = await track('source-map-js', results, () => {
    const smcjs = new SourceMapConsumerJs(encodedMapData);
    smcjs.originalPositionFor({ line: 1, column: 0 });
    return smcjs;
  });
  const smc061 = await track('source-map-0.6.1', results, () => {
    const smc061 = new SourceMapConsumer061(encodedMapData);
    smc061.originalPositionFor({ line: 1, column: 0 });
    return smc061;
  });
  const smcWasm = await track('source-map-0.8.0', results, async () => {
    const smcWasm = await new SourceMapConsumerWasm(encodedMapData);
    smcWasm.originalPositionFor({ line: 1, column: 0 });
    return smcWasm;
  });
  const winner = results.reduce((min, cur) => {
    if (cur.delta < min.delta) return cur;
    return min;
  });
  console.log(`Smallest memory usage is ${winner.label}`);

  console.log('');

  console.log('Init speed:');
  new Benchmark.Suite()
    .add('trace-mapping:    decoded JSON input', () => {
      originalPositionFor(new TraceMap(decodedMapDataJson), { line: 1, column: 0 });
    })
    .add('trace-mapping:    encoded JSON input', () => {
      originalPositionFor(new TraceMap(encodedMapDataJson), { line: 1, column: 0 });
    })
    .add('trace-mapping:    decoded Object input', () => {
      originalPositionFor(new TraceMap(decodedMapData), { line: 1, column: 0 });
    })
    .add('trace-mapping:    encoded Object input', () => {
      originalPositionFor(new TraceMap(encodedMapData), { line: 1, column: 0 });
    })
    .add('source-map-js:    encoded Object input', () => {
      new SourceMapConsumerJs(encodedMapData).originalPositionFor({ line: 1, column: 0 });
    })
    .add('source-map-0.6.1: encoded Object input', () => {
      new SourceMapConsumer061(encodedMapData).originalPositionFor({ line: 1, column: 0 });
    })
    // WASM isn't tested because its async and OOMs.
    // .add('source-map-0.8.0: encoded Object input', () => { })

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
  new Benchmark.Suite()
    .add('trace-mapping:    decoded originalPositionFor', () => {
      const i = Math.floor(Math.random() * lines.length);
      const line = lines[i];
      if (line.length === 0) return;
      const j = Math.floor(Math.random() * line.length);
      const column = line[j][0];
      originalPositionFor(decoded, { line: i + 1, column });
    })
    .add('trace-mapping:    encoded originalPositionFor', () => {
      const i = Math.floor(Math.random() * lines.length);
      const line = lines[i];
      if (line.length === 0) return;
      const j = Math.floor(Math.random() * line.length);
      const column = line[j][0];
      originalPositionFor(encoded, { line: i + 1, column });
    })
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
    })
    // add listeners
    .on('error', (event) => console.error(event.target.error))
    .on('cycle', (event) => {
      console.log(String(event.target));
    })
    .on('complete', function () {
      console.log('Fastest is ' + this.filter('fastest').map('name'));
    })
    .run({});

  smcWasm.destroy();
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
