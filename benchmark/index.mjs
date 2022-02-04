/* eslint-env node */

import { readdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, relative } from 'path';
import Benchmark from 'benchmark';
import { decode } from 'sourcemap-codec';
import TraceMap from '../dist/trace-mapping.mjs';
import { SourceMapConsumer as SourceMapConsumerJs } from 'source-map-js';
import { SourceMapConsumer as SourceMapConsumer061 } from 'source-map';

const dir = relative(process.cwd(), dirname(fileURLToPath(import.meta.url)));

export function bench(file) {
  const map = JSON.parse(readFileSync(join(dir, file)));
  const encodedMapData = map;
  const encodedMapDataJson = JSON.stringify(map);
  const decodedMapData = { ...map, mappings: decode(map.mappings) };
  const decodedMapDataJson = JSON.stringify(decodedMapData);

  new Benchmark.Suite()
    .add('trace-mapping: decoded JSON input', () => {
      new TraceMap(decodedMapDataJson).originalPositionFor({ line: 1, column: 0 });
    })
    .add('trace-mapping: encoded JSON input', () => {
      new TraceMap(encodedMapDataJson).originalPositionFor({ line: 1, column: 0 });
    })
    .add('trace-mapping: decoded Object input', () => {
      new TraceMap(decodedMapData).originalPositionFor({ line: 1, column: 0 });
    })
    .add('trace-mapping: encoded Object input', () => {
      new TraceMap(encodedMapData).originalPositionFor({ line: 1, column: 0 });
    })
    .add('source-map-js: encoded Object input', () => {
      new SourceMapConsumerJs(encodedMapData).originalPositionFor({ line: 1, column: 0 });
    })
    .add('source-map:    encoded Object input', () => {
      new SourceMapConsumer061(encodedMapData).originalPositionFor({ line: 1, column: 0 });
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

  console.log('');

  const decoded = new TraceMap(decodedMapData);
  const encoded = new TraceMap(encodedMapData);
  const smcjs = new SourceMapConsumerJs(encodedMapData);
  const smc061 = new SourceMapConsumer061(encodedMapData);

  const lines = decoded.decodedMappings();

  new Benchmark.Suite()
    .add('trace-mapping: decoded originalPositionFor', () => {
      const i = Math.floor(Math.random() * lines.length);
      const line = lines[i];
      if (line.length === 0) return;
      const j = Math.floor(Math.random() * line.length);
      const column = line[j][0];
      decoded.originalPositionFor({ line: i + 1, column });
    })
    .add('trace-mapping: encoded originalPositionFor', () => {
      const i = Math.floor(Math.random() * lines.length);
      const line = lines[i];
      if (line.length === 0) return;
      const j = Math.floor(Math.random() * line.length);
      const column = line[j][0];
      encoded.originalPositionFor({ line: i + 1, column });
    })
    .add('source-map-js: encoded originalPositionFor', () => {
      const i = Math.floor(Math.random() * lines.length);
      const line = lines[i];
      if (line.length === 0) return;
      const j = Math.floor(Math.random() * line.length);
      const column = line[j][0];
      smcjs.originalPositionFor({ line: i + 1, column });
    })
    .add('source-map:    encoded originalPositionFor', () => {
      const i = Math.floor(Math.random() * lines.length);
      const line = lines[i];
      if (line.length === 0) return;
      const j = Math.floor(Math.random() * line.length);
      const column = line[j][0];
      smc061.originalPositionFor({ line: i + 1, column });
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
}

const files = readdirSync(dir);
let first = true;
for (const file of files) {
  if (!file.endsWith('.map')) continue;

  if (!first) console.log('\n***\n');
  first = false;

  console.log(file);
  bench(file);
}
