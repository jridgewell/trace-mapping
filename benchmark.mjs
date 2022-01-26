/* eslint-env node */

import { readFileSync } from 'fs';
import Benchmark from 'benchmark';
import { decode } from 'sourcemap-codec';
import TraceMap from './dist/trace-mapping.mjs';

const map = JSON.parse(readFileSync(`dist/trace-mapping.umd.js.map`));

const encodedJson = JSON.stringify(map);
const decodedJson = JSON.stringify({ ...map, mappings: decode(map.mappings) });

console.log(process.version);

new Benchmark.Suite()
  .add('Encoded Map', () => {
    new TraceMap(encodedJson);
  })
  .add('Decoded Map', () => {
    new TraceMap(decodedJson);
  })
  // add listeners
  .on('error', console.error)
  .on('cycle', (event) => {
    console.log(String(event.target));
  })
  .on('complete', function () {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .run({});

console.log('');

const encoded = new TraceMap(encodedJson);
const decoded = new TraceMap(decodedJson);

new Benchmark.Suite()
  .add('Encoded traceSegment', () => {
    for (let i = 0; i < 500; i++) {
      for (let j = 0; j < 100; j++) {
        encoded.traceSegment(i, j);
      }
    }
  })
  .add('Decoded traceSegment', () => {
    for (let i = 0; i < 500; i++) {
      for (let j = 0; j < 100; j++) {
        decoded.traceSegment(i, j);
      }
    }
  })
  // add listeners
  .on('error', console.error)
  .on('cycle', (event) => {
    console.log(String(event.target));
  })
  .on('complete', function () {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .run({});
