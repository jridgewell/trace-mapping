export default {
  extensions: {
    ts: 'module',
  },
  nodeArguments: [
    '--no-warnings',
    '--loader=esbuild-node-loader',
    '--experimental-specifier-resolution=node',
  ],
  files: ['test/**/*.test.ts'],
};
