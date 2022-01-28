const base64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
const base64Index = new Uint8Array(128);
for (let i = 0; i < base64.length; i++) {
  base64Index[base64.charCodeAt(i)] = i;
}

export const ITEM_LENGTH = 5;

export function decode(encoded: string, lines: number[]): Uint32Array {
  let generatedColumn = 0;
  // 0 is used as a "not found" marker (because TypedArrays are 0 by default, so we don't need to
  // manually set any missing VLQ numbers), so these start at 1. Public APIs will decrement the
  // values so they are correct before returning to consumers.
  let sourcesIndex = 1;
  let sourceLine = 1;
  let sourceColumn = 1;
  let namesIndex = 1;

  let lineSorted = true;

  // count tracks the number of segments we have stored.
  let count = 0;
  // lastLineStart tracks the `count` of the segment that started the current line, so that we may
  // sort the line after it's complete.
  let lastLineStart = 0;
  let decoded = new Uint32Array(1000);

  // The first line starts with segment 0. If there are no mappings on this line, then the next
  // line will also start with segment 0 (meaning the first line ends with segment 0).
  lines.push(0);

  for (let pos = 0; pos < encoded.length; ) {
    switch (encoded.charCodeAt(pos)) {
      // Commas separate segements on a line.
      case 44: // ','
        pos++;
        continue;

      // Semicolons separates lines.
      case 59: // ';'
        lines.push(count);
        if (!lineSorted) easySort(decoded, lastLineStart, count);
        lineSorted = true;
        lastLineStart = count;
        // generatedColumn is reset when the next line starts, per the spec.
        generatedColumn = 0;
        pos++;
        continue;

      default:
        // Ensure that we have at least 5 items left in the decoded buffer, so we can push this
        // segment on.
        decoded = reserve(decoded, count, ITEM_LENGTH);

        // Segments are guaranteed to have at least the generatedColumn VLQ.
        pos = decodeInteger(encoded, pos, decoded, count);
        if (lineSorted) lineSorted = decoded[count] < 0;
        generatedColumn = decoded[count] += generatedColumn;
        count++;

        if (!hasMoreMappings(encoded, pos)) {
          count += 4;
          continue;
        }

        // If there are more VLQ, then we're guaranteed to have sourcesIndex, sourceLine, and
        // sourceColumn.
        pos = decodeInteger(encoded, pos, decoded, count);
        sourcesIndex = decoded[count] += sourcesIndex;
        count++;

        pos = decodeInteger(encoded, pos, decoded, count);
        sourceLine = decoded[count] += sourceLine;
        count++;

        pos = decodeInteger(encoded, pos, decoded, count);
        sourceColumn = decoded[count] += sourceColumn;
        count++;

        if (!hasMoreMappings(encoded, pos)) {
          count += 1;
          continue;
        }

        // Finally, namesIndex.
        pos = decodeInteger(encoded, pos, decoded, count);
        namesIndex = decoded[count] += namesIndex;
        count++;
    }
  }

  // Cap the lines, so that we can always look at index and index+1 for the start and end indices.
  lines.push(count);
  if (!lineSorted) easySort(decoded, lastLineStart, count);

  return decoded.subarray(0, count);
}

function reserve(buf: Uint32Array, pos: number, count: number): Uint32Array {
  if (buf.length > pos + count) return buf;

  const swap = new Uint32Array(buf.length * 2);
  swap.set(buf);
  return swap;
}

function hasMoreMappings(encoded: string, pos: number): boolean {
  if (pos === encoded.length) return false;
  const c = encoded.charCodeAt(pos);
  return c !== 44 /* ',' */ && c !== 59 /* ';' */;
}

function decodeInteger(encoded: string, pos: number, state: Uint32Array, index: number): number {
  let value = 0;
  let shift = 0;
  let integer = 0;

  // VLQ is a variable-length quantity (duh). The low 5 bits encode are integer data, with the 6th
  // bit being the "continue" bit signaling more data in the VLQ.
  do {
    const c = encoded.charCodeAt(pos++);
    integer = base64Index[c];
    value |= (integer & 0b011111) << shift;
    shift += 5;
  } while (integer & 0b100000);

  // The lowest bit encodes whether the VLQ was originally negative.
  const shouldNegate = value & 1;
  value >>>= 1;

  // Nomally, -x produces a negative value like you would expect. But what does `-0` represent? In
  // VLQ, it should represent -2,147,483,648 (the smallest 32bit signed int). But -0 is just 0 in
  // JS, so we have to bitwise-OR with -0x80000000. This won't affect any other value, eg
  // `-1 | -0x80000000` is still `-1`.
  if (shouldNegate) value = -0x80000000 | -value;

  state[index] = value;
  return pos;
}

function easySort(state: Uint32Array, start: number, end: number) {
  // This isn't a fast algorithm, but I believe it's exceedingly rare for a mapping to be unsorted.
  const segments = [];
  for (let i = start; i < end; i += ITEM_LENGTH) {
    segments.push(state.slice(i, i + ITEM_LENGTH));
  }
  segments.sort(sortComparator);
  for (let i = start, j = 0; i < end; i += ITEM_LENGTH, j++) {
    state.set(segments[j], i);
  }
}

function sortComparator(a: Uint32Array, b: Uint32Array): number {
  return a[0] - b[0];
}
