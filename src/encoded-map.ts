import { decode } from 'sourcemap-codec';

import { DecodedSourceMapImpl } from './decoded-map';

import type { EncodedSourceMap } from './types';

export class EncodedSourceMapImpl extends DecodedSourceMapImpl {
  constructor(map: EncodedSourceMap) {
    const decoded = Object.assign({}, map, { mappings: decode(map.mappings) });
    super(decoded, true);
  }
}
