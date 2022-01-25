import typescript from '@rollup/plugin-typescript';

function configure(esm) {
  return {
    input: 'src/trace-mapping.ts',
    output: esm
      ? {
          format: 'es',
          dir: 'dist',
          entryFileNames: '[name].mjs',
          sourcemap: true,
          exports: 'named',
        }
      : {
          format: 'umd',
          name: 'traceMapping',
          dir: 'dist',
          entryFileNames: '[name].umd.js',
          sourcemap: true,
          exports: 'named',
          globals: {
            '@jridgewell/resolve-uri': 'resolveURI',
            'sourcemap-codec': 'sourcemapCodec',
          },
        },
    plugins: [typescript({ tsconfig: './tsconfig.build.json' })],
    watch: {
      include: 'src/**',
    },
  };
}

export default [configure(false), configure(true)];
