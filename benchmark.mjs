/* eslint-env node */

import { readFileSync } from 'fs';
import Benchmark from 'benchmark';
import { decode } from 'sourcemap-codec';
import TraceMap from './dist/trace-mapping.mjs';
import { SourceMapConsumer } from 'source-map-js';

const map = JSON.parse(readFileSync(`dist/trace-mapping.umd.js.map`));

const encodedMapData = map;
const encodedMapDataJson = JSON.stringify(map);
const decodedMapData = { ...map, mappings: decode(map.mappings) };
const decodedMapDataJson = JSON.stringify(decodedMapData);

console.log(process.version);

new Benchmark.Suite()
  .add('Encoded Map', () => {
    new TraceMap(encodedMapData).originalPositionFor({ line: 1, column: 0 });
  })
  .add('Encoded JSON Map', () => {
    new TraceMap(encodedMapDataJson).originalPositionFor({ line: 1, column: 0 });
  })
  .add('Decoded Map', () => {
    new TraceMap(decodedMapData).originalPositionFor({ line: 1, column: 0 });
  })
  .add('Decoded JSON Map', () => {
    new TraceMap(decodedMapDataJson).originalPositionFor({ line: 1, column: 0 });
  })
  .add('source-map-js', () => {
    new SourceMapConsumer(map).originalPositionFor({ line: 1, column: 0 });
  })
  // add listeners
  .on('error', ({error}) => console.error(error))
  .on('cycle', (event) => {
    console.log(String(event.target));
  })
  .on('complete', function () {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .run({});

console.log('');

const encoded = new TraceMap(encodedMapData);
const decoded = new TraceMap(decodedMapData);
const smc = new SourceMapConsumer(map);

const lines = decoded.decodedMappings();

new Benchmark.Suite()
  .add('Encoded originalPositionFor', () => {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (let j = 0; j < line.length; j++) {
        const index = Math.floor(Math.random() * line.length);
        const column = line[index][0];
        encoded.originalPositionFor({ line: i + 1, column });
      }
    }
  })
  .add('Decoded originalPositionFor', () => {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (let j = 0; j < line.length; j++) {
        const index = Math.floor(Math.random() * line.length);
        const column = line[index][0];
        decoded.originalPositionFor({ line: i + 1, column });
      }
    }
  })
  .add('source-map-js originalPositionFor', () => {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (let j = 0; j < line.length; j++) {
        const index = Math.floor(Math.random() * line.length);
        const column = line[index][0];
        smc.originalPositionFor({ line: i + 1, column });
      }
    }
  })
  // add listeners
  .on('error', ({error}) => console.error(error))
  .on('cycle', (event) => {
    console.log(String(event.target));
  })
  .on('complete', function () {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .run({});
