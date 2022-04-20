/* eslint-env node */

import { readdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, relative } from 'path';
import Benchmark from 'benchmark';
import { decode } from '@jridgewell/sourcemap-codec';
import { TraceMap, decodedMappings, originalPositionFor } from '../dist/trace-mapping.mjs';
import { SourceMapConsumer as SourceMapConsumerJs } from 'source-map-js';
import { SourceMapConsumer as SourceMapConsumer061 } from 'source-map';
import { SourceMapConsumer as SourceMapConsumerWasm } from 'source-map-wasm';

const dir = relative(process.cwd(), dirname(fileURLToPath(import.meta.url)));

console.log(`node ${process.version}\n`);

async function bench(file) {
  const map = JSON.parse(readFileSync(join(dir, file)));
  const encodedMapData = map;
  const encodedMapDataJson = JSON.stringify(map);
  const decodedMapData = { ...map, mappings: decode(map.mappings) };
  const decodedMapDataJson = JSON.stringify(decodedMapData);

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
    .on('error', ({ error }) => console.error(error))
    .on('cycle', (event) => {
      console.log(String(event.target));
    })
    .on('complete', function () {
      console.log('Fastest is ' + this.filter('fastest').map('name'));
    })
    .run({});

  console.log('');

  const decoded = new TraceMap(decodedMapData);
  const encoded = new TraceMap(encodedMapData);
  const smcjs = new SourceMapConsumerJs(encodedMapData);
  const smc061 = new SourceMapConsumer061(encodedMapData);
  const smcWasm = await new SourceMapConsumerWasm(encodedMapData);

  const lines = decodedMappings(decoded);

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
    .on('error', ({ error }) => console.error(error))
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

    if (!first) console.log('\n***\n');
    first = false;

    console.log(file);
    await bench(file);
  }
}
run(readdirSync(dir));
