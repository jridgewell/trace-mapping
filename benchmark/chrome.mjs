// This is an approximation of Chrome's source map decoding.
// https://source.chromium.org/chromium/chromium/src/+/main:v8/tools/sourcemap.mjs;drc=7a90c32032759a1596fb9a0549cced1b89f42c5f

export function SourceMap(sourceMappingURL, payload) {
  if (!SourceMap.prototype._base64Map) {
    const base64Digits = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    SourceMap.prototype._base64Map = {};
    for (let i = 0; i < base64Digits.length; ++i)
      SourceMap.prototype._base64Map[base64Digits.charAt(i)] = i;
  }

  this._sourceMappingURL = sourceMappingURL;
  this._reverseMappingsBySourceURL = {};
  this._mappings = [];
  this._sources = {};
  this._sourceContentByURL = {};
  this._parseMappingPayload(payload);
}

SourceMap.prototype = {
  /**
   * @return {string[]}
   */
  sources() {
    return Object.keys(this._sources);
  },

  /**
   * @param {string} sourceURL
   * @return {string|undefined}
   */
  sourceContent(sourceURL) {
    return this._sourceContentByURL[sourceURL];
  },

  /**
   * @param {SourceMapV3} mappingPayload
   */
  _parseMappingPayload(mappingPayload) {
    if (mappingPayload.sections) this._parseSections(mappingPayload.sections);
    else this._parseMap(mappingPayload, 0, 0);
  },

  /**
   * @param {Array.<SourceMapV3.Section>} sections
   */
  _parseSections(sections) {
    for (let i = 0; i < sections.length; ++i) {
      const section = sections[i];
      this._parseMap(section.map, section.offset.line, section.offset.column);
    }
  },

  /**
   * @param {number} lineNumber in compiled resource
   * @param {number} columnNumber in compiled resource
   * @return {?Array}
   */
  findEntry(lineNumber, columnNumber) {
    let first = 0;
    let count = this._mappings.length;
    while (count > 1) {
      const step = count >> 1;
      const middle = first + step;
      const mapping = this._mappings[middle];
      if (lineNumber < mapping[0] || (lineNumber === mapping[0] && columnNumber < mapping[1]))
        count = step;
      else {
        first = middle;
        count -= step;
      }
    }
    const entry = this._mappings[first];
    if (
      !first &&
      entry &&
      (lineNumber < entry[0] || (lineNumber === entry[0] && columnNumber < entry[1]))
    )
      return null;
    return entry;
  },

  /**
   * @param {string} sourceURL of the originating resource
   * @param {number} lineNumber in the originating resource
   * @return {Array}
   */
  findEntryReversed(sourceURL, lineNumber) {
    const mappings = this._reverseMappingsBySourceURL[sourceURL];
    for (; lineNumber < mappings.length; ++lineNumber) {
      const mapping = mappings[lineNumber];
      if (mapping) return mapping;
    }
    return this._mappings[0];
  },

  /**
   * @override
   */
  _parseMap(map, lineNumber, columnNumber) {
    let sourceIndex = 0;
    let sourceLineNumber = 0;
    let sourceColumnNumber = 0;
    let nameIndex = 0;

    const sources = [];
    const originalToCanonicalURLMap = {};
    for (let i = 0; i < map.sources.length; ++i) {
      const originalSourceURL = map.sources[i];
      let sourceRoot = map.sourceRoot || '';
      if (sourceRoot && !sourceRoot.endsWith('/')) sourceRoot += '/';
      const href = sourceRoot + originalSourceURL;
      const url = ParsedURL.completeURL(this._sourceMappingURL, href) || href;
      originalToCanonicalURLMap[originalSourceURL] = url;
      sources.push(url);
      this._sources[url] = true;

      if (map.sourcesContent && map.sourcesContent[i]) {
        this._sourceContentByURL[url] = map.sourcesContent[i];
      }
    }

    const stringCharIterator = new SourceMap.StringCharIterator(map.mappings);
    let sourceURL = sources[sourceIndex];

    while (true) {
      if (stringCharIterator.peek() === ',') stringCharIterator.next();
      else {
        while (stringCharIterator.peek() === ';') {
          lineNumber += 1;
          columnNumber = 0;
          stringCharIterator.next();
        }
        if (!stringCharIterator.hasNext()) break;
      }

      columnNumber += this._decodeVLQ(stringCharIterator);
      if (this._isSeparator(stringCharIterator.peek())) {
        this._mappings.push([lineNumber, columnNumber]);
        continue;
      }

      const sourceIndexDelta = this._decodeVLQ(stringCharIterator);
      if (sourceIndexDelta) {
        sourceIndex += sourceIndexDelta;
        sourceURL = sources[sourceIndex];
      }
      sourceLineNumber += this._decodeVLQ(stringCharIterator);
      sourceColumnNumber += this._decodeVLQ(stringCharIterator);
      if (!this._isSeparator(stringCharIterator.peek()))
        nameIndex += this._decodeVLQ(stringCharIterator);

      this._mappings.push([
        lineNumber,
        columnNumber,
        sourceURL,
        sourceLineNumber,
        sourceColumnNumber,
      ]);
    }

    for (let i = 0; i < this._mappings.length; ++i) {
      const mapping = this._mappings[i];
      const url = mapping[2];
      if (!url) continue;
      if (!this._reverseMappingsBySourceURL[url]) {
        this._reverseMappingsBySourceURL[url] = [];
      }
      const reverseMappings = this._reverseMappingsBySourceURL[url];
      const sourceLine = mapping[3];
      if (!reverseMappings[sourceLine]) {
        reverseMappings[sourceLine] = [mapping[0], mapping[1]];
      }
    }
  },

  /**
   * @param {string} char
   * @return {boolean}
   */
  _isSeparator(char) {
    return char === ',' || char === ';';
  },

  /**
   * @param {SourceMap.StringCharIterator} stringCharIterator
   * @return {number}
   */
  _decodeVLQ(stringCharIterator) {
    // Read unsigned value.
    let result = 0;
    let shift = 0;
    let digit;
    do {
      digit = this._base64Map[stringCharIterator.next()];
      result += (digit & this._VLQ_BASE_MASK) << shift;
      shift += this._VLQ_BASE_SHIFT;
    } while (digit & this._VLQ_CONTINUATION_MASK);

    // Fix the sign.
    const negate = result & 1;
    // Use unsigned right shift, so that the 32nd bit is properly shifted
    // to the 31st, and the 32nd becomes unset.
    result >>>= 1;
    if (negate) {
      // We need to OR 0x80000000 here to ensure the 32nd bit (the sign bit
      // in a 32bit int) is always set for negative numbers. If `result`
      // were 1, (meaning `negate` is true and all other bits were zeros),
      // `result` would now be 0. But -0 doesn't flip the 32nd bit as
      // intended. All other numbers will successfully set the 32nd bit
      // without issue, so doing this is a noop for them.
      return -result | 0x80000000;
    }
    return result;
  },

  _VLQ_BASE_SHIFT: 5,
  _VLQ_BASE_MASK: (1 << 5) - 1,
  _VLQ_CONTINUATION_MASK: 1 << 5,
};

SourceMap.StringCharIterator = function StringCharIterator(string) {
  this._string = string;
  this._position = 0;
};

SourceMap.StringCharIterator.prototype = {
  /**
   * @return {string}
   */
  next() {
    return this._string.charAt(this._position++);
  },

  /**
   * @return {string}
   */
  peek() {
    return this._string.charAt(this._position);
  },

  /**
   * @return {boolean}
   */
  hasNext() {
    return this._position < this._string.length;
  },
};

function normalizePath(path) {
  if (path.indexOf('..') === -1 && path.indexOf('.') === -1) {
    return path;
  }
  // Remove leading slash (will be added back below) so we
  // can handle all (including empty) segments consistently.
  const segments = (path[0] === '/' ? path.substring(1) : path).split('/');
  const normalizedSegments = [];
  for (const segment of segments) {
    if (segment === '.') {
      continue;
    } else if (segment === '..') {
      normalizedSegments.pop();
    } else {
      normalizedSegments.push(segment);
    }
  }
  let normalizedPath = normalizedSegments.join('/');
  if (path[0] === '/' && normalizedPath) {
    normalizedPath = '/' + normalizedPath;
  }
  if (
    normalizedPath[normalizedPath.length - 1] !== '/' &&
    (path[path.length - 1] === '/' ||
      segments[segments.length - 1] === '.' ||
      segments[segments.length - 1] === '..')
  ) {
    normalizedPath = normalizedPath + '/';
  }
  return normalizedPath;
}
export function schemeIs(url, scheme) {
  try {
    return new URL(url).protocol === scheme;
  } catch (e) {
    return false;
  }
}
export class ParsedURL {
  #displayNameInternal;
  #dataURLDisplayNameInternal;
  constructor(url) {
    this.isValid = false;
    this.url = url;
    this.scheme = '';
    this.user = '';
    this.host = '';
    this.port = '';
    this.path = '';
    this.queryParams = '';
    this.fragment = '';
    this.folderPathComponents = '';
    this.lastPathComponent = '';
    const isBlobUrl = this.url.startsWith('blob:');
    const urlToMatch = isBlobUrl ? url.substring(5) : url;
    const match = urlToMatch.match(ParsedURL.urlRegex());
    if (match) {
      this.isValid = true;
      if (isBlobUrl) {
        this.blobInnerScheme = match[2].toLowerCase();
        this.scheme = 'blob';
      } else {
        this.scheme = match[2].toLowerCase();
      }
      this.user = match[3] ?? '';
      this.host = match[4] ?? '';
      this.port = match[5] ?? '';
      this.path = match[6] ?? '/';
      this.queryParams = match[7] ?? '';
      this.fragment = match[8] ?? '';
    } else {
      if (this.url.startsWith('data:')) {
        this.scheme = 'data';
        return;
      }
      if (this.url.startsWith('blob:')) {
        this.scheme = 'blob';
        return;
      }
      if (this.url === 'about:blank') {
        this.scheme = 'about';
        return;
      }
      this.path = this.url;
    }
    const lastSlashExceptTrailingIndex = this.path.lastIndexOf('/', this.path.length - 2);
    if (lastSlashExceptTrailingIndex !== -1) {
      this.lastPathComponent = this.path.substring(lastSlashExceptTrailingIndex + 1);
    } else {
      this.lastPathComponent = this.path;
    }
    const lastSlashIndex = this.path.lastIndexOf('/');
    if (lastSlashIndex !== -1) {
      this.folderPathComponents = this.path.substring(0, lastSlashIndex);
    }
  }
  static fromString(string) {
    const parsedURL = new ParsedURL(string.toString());
    if (parsedURL.isValid) {
      return parsedURL;
    }
    return null;
  }
  static preEncodeSpecialCharactersInPath(path) {
    // Based on net::FilePathToFileURL. Ideally we would handle
    // '\\' as well on non-Windows file systems.
    for (const specialChar of ['%', ';', '#', '?', ' ']) {
      path = path.replaceAll(specialChar, encodeURIComponent(specialChar));
    }
    return path;
  }
  static rawPathToEncodedPathString(path) {
    const partiallyEncoded = ParsedURL.preEncodeSpecialCharactersInPath(path);
    if (path.startsWith('/')) {
      return new URL(partiallyEncoded, 'file:///').pathname;
    }
    // URL prepends a '/'
    return new URL('/' + partiallyEncoded, 'file:///').pathname.substring(1);
  }
  /**
   * @param name Must not be encoded
   */
  static encodedFromParentPathAndName(parentPath, name) {
    return ParsedURL.concatenate(parentPath, '/', ParsedURL.preEncodeSpecialCharactersInPath(name));
  }
  /**
   * @param name Must not be encoded
   */
  static urlFromParentUrlAndName(parentUrl, name) {
    return ParsedURL.concatenate(parentUrl, '/', ParsedURL.preEncodeSpecialCharactersInPath(name));
  }
  static encodedPathToRawPathString(encPath) {
    return decodeURIComponent(encPath);
  }
  static rawPathToUrlString(fileSystemPath) {
    let preEncodedPath = ParsedURL.preEncodeSpecialCharactersInPath(
      fileSystemPath.replace(/\\/g, '/'),
    );
    preEncodedPath = preEncodedPath.replace(/\\/g, '/');
    if (!preEncodedPath.startsWith('file://')) {
      if (preEncodedPath.startsWith('/')) {
        preEncodedPath = 'file://' + preEncodedPath;
      } else {
        preEncodedPath = 'file:///' + preEncodedPath;
      }
    }
    return new URL(preEncodedPath).toString();
  }
  static relativePathToUrlString(relativePath, baseURL) {
    const preEncodedPath = ParsedURL.preEncodeSpecialCharactersInPath(
      relativePath.replace(/\\/g, '/'),
    );
    return new URL(preEncodedPath, baseURL).toString();
  }
  static urlToRawPathString(fileURL, isWindows) {
    console.assert(fileURL.startsWith('file://'), 'This must be a file URL.');
    const decodedFileURL = decodeURIComponent(fileURL);
    if (isWindows) {
      return decodedFileURL.substring('file:///'.length).replace(/\//g, '\\');
    }
    return decodedFileURL.substring('file://'.length);
  }
  static sliceUrlToEncodedPathString(url, start) {
    return url.substring(start);
  }
  static substr(devToolsPath, from, length) {
    return devToolsPath.substr(from, length);
  }
  static substring(devToolsPath, start, end) {
    return devToolsPath.substring(start, end);
  }
  static prepend(prefix, devToolsPath) {
    return prefix + devToolsPath;
  }
  static concatenate(devToolsPath, ...appendage) {
    return devToolsPath.concat(...appendage);
  }
  static trim(devToolsPath) {
    return devToolsPath.trim();
  }
  static slice(devToolsPath, start, end) {
    return devToolsPath.slice(start, end);
  }
  static join(devToolsPaths, separator) {
    return devToolsPaths.join(separator);
  }
  static split(devToolsPath, separator, limit) {
    return devToolsPath.split(separator, limit);
  }
  static toLowerCase(devToolsPath) {
    return devToolsPath.toLowerCase();
  }
  static isValidUrlString(str) {
    return new ParsedURL(str).isValid;
  }
  static urlWithoutHash(url) {
    const hashIndex = url.indexOf('#');
    if (hashIndex !== -1) {
      return url.substr(0, hashIndex);
    }
    return url;
  }
  static urlRegex() {
    if (ParsedURL.urlRegexInstance) {
      return ParsedURL.urlRegexInstance;
    }
    // RegExp groups:
    // 1 - scheme, hostname, ?port
    // 2 - scheme (using the RFC3986 grammar)
    // 3 - ?user:password
    // 4 - hostname
    // 5 - ?port
    // 6 - ?path
    // 7 - ?query
    // 8 - ?fragment
    const schemeRegex = /([A-Za-z][A-Za-z0-9+.-]*):\/\//;
    const userRegex = /(?:([A-Za-z0-9\-._~%!$&'()*+,;=:]*)@)?/;
    const hostRegex = /((?:\[::\d?\])|(?:[^\s\/:]*))/;
    const portRegex = /(?::([\d]+))?/;
    const pathRegex = /(\/[^#?]*)?/;
    const queryRegex = /(?:\?([^#]*))?/;
    const fragmentRegex = /(?:#(.*))?/;
    ParsedURL.urlRegexInstance = new RegExp(
      '^(' +
        schemeRegex.source +
        userRegex.source +
        hostRegex.source +
        portRegex.source +
        ')' +
        pathRegex.source +
        queryRegex.source +
        fragmentRegex.source +
        '$',
    );
    return ParsedURL.urlRegexInstance;
  }
  static extractPath(url) {
    const parsedURL = this.fromString(url);
    return parsedURL ? parsedURL.path : '';
  }
  static extractOrigin(url) {
    const parsedURL = this.fromString(url);
    return parsedURL ? parsedURL.securityOrigin() : '';
  }
  static extractExtension(url) {
    url = ParsedURL.urlWithoutHash(url);
    const indexOfQuestionMark = url.indexOf('?');
    if (indexOfQuestionMark !== -1) {
      url = url.substr(0, indexOfQuestionMark);
    }
    const lastIndexOfSlash = url.lastIndexOf('/');
    if (lastIndexOfSlash !== -1) {
      url = url.substr(lastIndexOfSlash + 1);
    }
    const lastIndexOfDot = url.lastIndexOf('.');
    if (lastIndexOfDot !== -1) {
      url = url.substr(lastIndexOfDot + 1);
      const lastIndexOfPercent = url.indexOf('%');
      if (lastIndexOfPercent !== -1) {
        return url.substr(0, lastIndexOfPercent);
      }
      return url;
    }
    return '';
  }
  static extractName(url) {
    let index = url.lastIndexOf('/');
    const pathAndQuery = index !== -1 ? url.substr(index + 1) : url;
    index = pathAndQuery.indexOf('?');
    return index < 0 ? pathAndQuery : pathAndQuery.substr(0, index);
  }
  static completeURL(baseURL, href) {
    // Return special URLs as-is.
    const trimmedHref = href.trim();
    if (
      trimmedHref.startsWith('data:') ||
      trimmedHref.startsWith('blob:') ||
      trimmedHref.startsWith('javascript:') ||
      trimmedHref.startsWith('mailto:')
    ) {
      return href;
    }
    // Return absolute URLs with normalized path and other components as-is.
    const parsedHref = this.fromString(trimmedHref);
    if (parsedHref && parsedHref.scheme) {
      const securityOrigin = parsedHref.securityOrigin();
      const pathText = normalizePath(parsedHref.path);
      const queryText = parsedHref.queryParams && `?${parsedHref.queryParams}`;
      const fragmentText = parsedHref.fragment && `#${parsedHref.fragment}`;
      return securityOrigin + pathText + queryText + fragmentText;
    }
    const parsedURL = this.fromString(baseURL);
    if (!parsedURL) {
      return null;
    }
    if (parsedURL.isDataURL()) {
      return href;
    }
    if (href.length > 1 && href.charAt(0) === '/' && href.charAt(1) === '/') {
      // href starts with "//" which is a full URL with the protocol dropped (use the baseURL protocol).
      return parsedURL.scheme + ':' + href;
    }
    const securityOrigin = parsedURL.securityOrigin();
    const pathText = parsedURL.path;
    const queryText = parsedURL.queryParams ? '?' + parsedURL.queryParams : '';
    // Empty href resolves to a URL without fragment.
    if (!href.length) {
      return securityOrigin + pathText + queryText;
    }
    if (href.charAt(0) === '#') {
      return securityOrigin + pathText + queryText + href;
    }
    if (href.charAt(0) === '?') {
      return securityOrigin + pathText + href;
    }
    const hrefMatches = href.match(/^[^#?]*/);
    if (!hrefMatches || !href.length) {
      throw new Error('Invalid href');
    }
    let hrefPath = hrefMatches[0];
    const hrefSuffix = href.substring(hrefPath.length);
    if (hrefPath.charAt(0) !== '/') {
      hrefPath = parsedURL.folderPathComponents + '/' + hrefPath;
    }
    return securityOrigin + normalizePath(hrefPath) + hrefSuffix;
  }
  static splitLineAndColumn(string) {
    // Only look for line and column numbers in the path to avoid matching port numbers.
    const beforePathMatch = string.match(ParsedURL.urlRegex());
    let beforePath = '';
    let pathAndAfter = string;
    if (beforePathMatch) {
      beforePath = beforePathMatch[1];
      pathAndAfter = string.substring(beforePathMatch[1].length);
    }
    const lineColumnRegEx = /(?::(\d+))?(?::(\d+))?$/;
    const lineColumnMatch = lineColumnRegEx.exec(pathAndAfter);
    let lineNumber;
    let columnNumber;
    console.assert(Boolean(lineColumnMatch));
    if (!lineColumnMatch) {
      return { url: string, lineNumber: 0, columnNumber: 0 };
    }
    if (typeof lineColumnMatch[1] === 'string') {
      lineNumber = parseInt(lineColumnMatch[1], 10);
      // Immediately convert line and column to 0-based numbers.
      lineNumber = isNaN(lineNumber) ? undefined : lineNumber - 1;
    }
    if (typeof lineColumnMatch[2] === 'string') {
      columnNumber = parseInt(lineColumnMatch[2], 10);
      columnNumber = isNaN(columnNumber) ? undefined : columnNumber - 1;
    }
    let url =
      beforePath + pathAndAfter.substring(0, pathAndAfter.length - lineColumnMatch[0].length);
    if (lineColumnMatch[1] === undefined && lineColumnMatch[2] === undefined) {
      const wasmCodeOffsetRegex = /wasm-function\[\d+\]:0x([a-z0-9]+)$/g;
      const wasmCodeOffsetMatch = wasmCodeOffsetRegex.exec(pathAndAfter);
      if (wasmCodeOffsetMatch && typeof wasmCodeOffsetMatch[1] === 'string') {
        url = ParsedURL.removeWasmFunctionInfoFromURL(url);
        columnNumber = parseInt(wasmCodeOffsetMatch[1], 16);
        columnNumber = isNaN(columnNumber) ? undefined : columnNumber;
      }
    }
    return { url, lineNumber, columnNumber };
  }
  static removeWasmFunctionInfoFromURL(url) {
    const wasmFunctionRegEx = /:wasm-function\[\d+\]/;
    const wasmFunctionIndex = url.search(wasmFunctionRegEx);
    if (wasmFunctionIndex === -1) {
      return url;
    }
    return ParsedURL.substring(url, 0, wasmFunctionIndex);
  }
  static beginsWithWindowsDriveLetter(url) {
    return /^[A-Za-z]:/.test(url);
  }
  static beginsWithScheme(url) {
    return /^[A-Za-z][A-Za-z0-9+.-]*:/.test(url);
  }
  static isRelativeURL(url) {
    return !this.beginsWithScheme(url) || this.beginsWithWindowsDriveLetter(url);
  }
  get displayName() {
    if (this.#displayNameInternal) {
      return this.#displayNameInternal;
    }
    if (this.isDataURL()) {
      return this.dataURLDisplayName();
    }
    if (this.isBlobURL()) {
      return this.url;
    }
    if (this.isAboutBlank()) {
      return this.url;
    }
    this.#displayNameInternal = this.lastPathComponent;
    if (!this.#displayNameInternal) {
      this.#displayNameInternal = (this.host || '') + '/';
    }
    if (this.#displayNameInternal === '/') {
      this.#displayNameInternal = this.url;
    }
    return this.#displayNameInternal;
  }
  dataURLDisplayName() {
    if (this.#dataURLDisplayNameInternal) {
      return this.#dataURLDisplayNameInternal;
    }
    if (!this.isDataURL()) {
      return '';
    }
    this.#dataURLDisplayNameInternal = trimEndWithMaxLength(this.url, 20);
    return this.#dataURLDisplayNameInternal;
  }
  isAboutBlank() {
    return this.url === 'about:blank';
  }
  isDataURL() {
    return this.scheme === 'data';
  }
  isHttpOrHttps() {
    return this.scheme === 'http' || this.scheme === 'https';
  }
  isBlobURL() {
    return this.url.startsWith('blob:');
  }
  lastPathComponentWithFragment() {
    return this.lastPathComponent + (this.fragment ? '#' + this.fragment : '');
  }
  domain() {
    if (this.isDataURL()) {
      return 'data:';
    }
    return this.host + (this.port ? ':' + this.port : '');
  }
  securityOrigin() {
    if (this.isDataURL()) {
      return 'data:';
    }
    const scheme = this.isBlobURL() ? this.blobInnerScheme : this.scheme;
    return scheme + '://' + this.domain();
  }
  urlWithoutScheme() {
    if (this.scheme && this.url.startsWith(this.scheme + '://')) {
      return this.url.substring(this.scheme.length + 3);
    }
    return this.url;
  }
  static {
    this.urlRegexInstance = null;
  }
}
export const trimEndWithMaxLength = (str, maxLength) => {
  if (str.length <= maxLength) {
    return String(str);
  }
  return str.substr(0, maxLength - 1) + '\u2026';
};
