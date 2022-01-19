/* eslint-env node */

import { basename, join, relative } from 'path';
import { readFileSync, mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import { transformAsync } from '@babel/core';

import esbuild from 'esbuild';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

mkdirSync('dist');

async function build(format, opts) {
  const { outputFiles } = await esbuild.build({
    entryPoints: [join('src', 'trace-mapping.ts')],
    bundle: true,
    sourcemap: 'inline',
    external: Object.keys(pkg.dependencies),
    write: false,
    ...opts,
  });
  const [js] = outputFiles;

  const { code, map } = await transformAsync(js.text, {
    presets: [
      [
        '@babel/preset-env',
        {
          bugfixes: true,
          targets: { esmodules: true },
          loose: true,
          modules: format,
        },
      ],
    ],
    moduleId: 'traceMapping',
    inputSourceMap: true,
    sourceMaps: true,
    sourceFileName: basename(js.path),
    sourceType: 'module',
    filename: basename(js.path),
    filenameRelative: relative(process.cwd(), js.path),
  });

  writeFile(js.path, code);
  writeFile(js.path + '.map', JSON.stringify(map));
}

build(false, {
  outfile: join('dist', 'trace-mapping.mjs'),
  format: 'esm',
  target: 'esnext',
});
build('cjs', {
  outfile: join('dist', 'trace-mapping.cjs'),
  format: 'esm',
  target: 'esnext',
});
build('umd', {
  outfile: join('dist', 'trace-mapping.umd.js'),
  format: 'esm',
  target: 'esnext',
  external: undefined,
});
