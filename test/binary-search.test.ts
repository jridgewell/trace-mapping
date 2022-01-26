import { binarySearch } from '../src/binary-search';
import { test, describe } from './setup';

describe('binary search', () => {
  function comparator(item: number, needle: number): number {
    return item - needle;
  }

  function suite(len: number) {
    function push(array: number[], x: number) {
      array.push(x);
      for (let j = 1; j < len; j++) array.push(-1);
    }

    return () => {
      test('returns index of match', (t) => {
        const array: number[] = [];

        push(array, 0);
        t.is(binarySearch(array, 0, comparator, 0, array.length - 1, len), len * 0);

        push(array, 1);
        t.is(binarySearch(array, 0, comparator, 0, array.length - 1, len), len * 0);
        t.is(binarySearch(array, 1, comparator, 0, array.length - 1, len), len * 1);

        push(array, 2);
        t.is(binarySearch(array, 0, comparator, 0, array.length - 1, len), len * 0);
        t.is(binarySearch(array, 1, comparator, 0, array.length - 1, len), len * 1);
        t.is(binarySearch(array, 2, comparator, 0, array.length - 1, len), len * 2);

        push(array, 3);
        t.is(binarySearch(array, 0, comparator, 0, array.length - 1, len), len * 0);
        t.is(binarySearch(array, 1, comparator, 0, array.length - 1, len), len * 1);
        t.is(binarySearch(array, 2, comparator, 0, array.length - 1, len), len * 2);
        t.is(binarySearch(array, 3, comparator, 0, array.length - 1, len), len * 3);

        push(array, 4);
        t.is(binarySearch(array, 0, comparator, 0, array.length - 1, len), len * 0);
        t.is(binarySearch(array, 1, comparator, 0, array.length - 1, len), len * 1);
        t.is(binarySearch(array, 2, comparator, 0, array.length - 1, len), len * 2);
        t.is(binarySearch(array, 3, comparator, 0, array.length - 1, len), len * 3);
        t.is(binarySearch(array, 4, comparator, 0, array.length - 1, len), len * 4);

        push(array, 5);
        t.is(binarySearch(array, 0, comparator, 0, array.length - 1, len), len * 0);
        t.is(binarySearch(array, 1, comparator, 0, array.length - 1, len), len * 1);
        t.is(binarySearch(array, 2, comparator, 0, array.length - 1, len), len * 2);
        t.is(binarySearch(array, 3, comparator, 0, array.length - 1, len), len * 3);
        t.is(binarySearch(array, 4, comparator, 0, array.length - 1, len), len * 4);
        t.is(binarySearch(array, 5, comparator, 0, array.length - 1, len), len * 5);
      });

      test('for non-match returns index for value lower than needle', (t) => {
        // Test middles, which have a number left and right of index.
        const array: number[] = [];

        push(array, 0);
        t.is(binarySearch(array, -1, comparator, 0, array.length - 1, len), -len);
        t.is(binarySearch(array, 1, comparator, 0, array.length - 1, len), len * 0);

        push(array, 2);
        t.is(binarySearch(array, -1, comparator, 0, array.length - 1, len), -len);
        t.is(binarySearch(array, 1, comparator, 0, array.length - 1, len), len * 0);
        t.is(binarySearch(array, 3, comparator, 0, array.length - 1, len), len * 1);

        push(array, 4);
        t.is(binarySearch(array, -1, comparator, 0, array.length - 1, len), -len);
        t.is(binarySearch(array, 1, comparator, 0, array.length - 1, len), len * 0);
        t.is(binarySearch(array, 3, comparator, 0, array.length - 1, len), len * 1);
        t.is(binarySearch(array, 5, comparator, 0, array.length - 1, len), len * 2);

        push(array, 6);
        t.is(binarySearch(array, -1, comparator, 0, array.length - 1, len), -len);
        t.is(binarySearch(array, 1, comparator, 0, array.length - 1, len), len * 0);
        t.is(binarySearch(array, 3, comparator, 0, array.length - 1, len), len * 1);
        t.is(binarySearch(array, 5, comparator, 0, array.length - 1, len), len * 2);
        t.is(binarySearch(array, 7, comparator, 0, array.length - 1, len), len * 3);

        push(array, 8);
        t.is(binarySearch(array, -1, comparator, 0, array.length - 1, len), -len);
        t.is(binarySearch(array, 1, comparator, 0, array.length - 1, len), len * 0);
        t.is(binarySearch(array, 3, comparator, 0, array.length - 1, len), len * 1);
        t.is(binarySearch(array, 5, comparator, 0, array.length - 1, len), len * 2);
        t.is(binarySearch(array, 7, comparator, 0, array.length - 1, len), len * 3);
        t.is(binarySearch(array, 9, comparator, 0, array.length - 1, len), len * 4);

        push(array, 10);
        t.is(binarySearch(array, -1, comparator, 0, array.length - 1, len), -len);
        t.is(binarySearch(array, 1, comparator, 0, array.length - 1, len), len * 0);
        t.is(binarySearch(array, 3, comparator, 0, array.length - 1, len), len * 1);
        t.is(binarySearch(array, 5, comparator, 0, array.length - 1, len), len * 2);
        t.is(binarySearch(array, 7, comparator, 0, array.length - 1, len), len * 3);
        t.is(binarySearch(array, 9, comparator, 0, array.length - 1, len), len * 4);
        t.is(binarySearch(array, 11, comparator, 0, array.length - 1, len), len * 5);
      });

      test('needle is lower than all elements returns -len', (t) => {
        const array: number[] = [];
        const needle = -1;

        push(array, 0);
        t.is(binarySearch(array, needle, comparator, 0, array.length - 1, len), -len);

        push(array, 1);
        t.is(binarySearch(array, needle, comparator, 0, array.length - 1, len), -len);

        push(array, 2);
        t.is(binarySearch(array, needle, comparator, 0, array.length - 1, len), -len);

        push(array, 3);
        t.is(binarySearch(array, needle, comparator, 0, array.length - 1, len), -len);

        push(array, 4);
        t.is(binarySearch(array, needle, comparator, 0, array.length - 1, len), -len);

        push(array, 5);
        t.is(binarySearch(array, needle, comparator, 0, array.length - 1, len), -len);
      });

      test('needle is higher than all elements returns last index', (t) => {
        const array: number[] = [];
        const needle = 2 ** 16;

        push(array, 0);
        t.is(binarySearch(array, needle, comparator, 0, array.length - 1, len), array.length - len);

        push(array, 1);
        t.is(binarySearch(array, needle, comparator, 0, array.length - 1, len), array.length - len);

        push(array, 2);
        t.is(binarySearch(array, needle, comparator, 0, array.length - 1, len), array.length - len);

        push(array, 3);
        t.is(binarySearch(array, needle, comparator, 0, array.length - 1, len), array.length - len);

        push(array, 4);
        t.is(binarySearch(array, needle, comparator, 0, array.length - 1, len), array.length - len);

        push(array, 5);
        t.is(binarySearch(array, needle, comparator, 0, array.length - 1, len), array.length - len);
      });

      test('empty array returns -len', (t) => {
        const array: number[] = [];

        t.is(binarySearch(array, -1, comparator, 0, array.length - 1, len), -len);
        t.is(binarySearch(array, 0, comparator, 0, array.length - 1, len), -len);
        t.is(binarySearch(array, 1, comparator, 0, array.length - 1, len), -len);
      });

      test('multiple items in array returns any match', (t) => {
        const array: number[] = [];
        const needle = 1;

        push(array, needle);
        t.is(binarySearch(array, needle, comparator, 0, array.length - 1, len), len * 0);

        push(array, needle);
        t.is(binarySearch(array, needle, comparator, 0, array.length - 1, len), len * 0);

        push(array, needle);
        t.is(binarySearch(array, needle, comparator, 0, array.length - 1, len), len * 1);

        push(array, needle);
        t.is(binarySearch(array, needle, comparator, 0, array.length - 1, len), len * 1);

        push(array, needle);
        t.is(binarySearch(array, needle, comparator, 0, array.length - 1, len), len * 2);

        push(array, needle);
        t.is(binarySearch(array, needle, comparator, 0, array.length - 1, len), len * 2);
      });

      describe('low', () => {
        test('low equals needle index returns needle index', (t) => {
          const array: number[] = [];

          push(array, 0);
          t.is(binarySearch(array, 0, comparator, len * 0, array.length - 1, len), len * 0);

          push(array, 1);
          t.is(binarySearch(array, 0, comparator, len * 0, array.length - 1, len), len * 0);
          t.is(binarySearch(array, 1, comparator, len * 1, array.length - 1, len), len * 1);

          push(array, 2);
          t.is(binarySearch(array, 0, comparator, len * 0, array.length - 1, len), len * 0);
          t.is(binarySearch(array, 1, comparator, len * 1, array.length - 1, len), len * 1);
          t.is(binarySearch(array, 2, comparator, len * 2, array.length - 1, len), len * 2);

          push(array, 3);
          t.is(binarySearch(array, 0, comparator, len * 0, array.length - 1, len), len * 0);
          t.is(binarySearch(array, 1, comparator, len * 1, array.length - 1, len), len * 1);
          t.is(binarySearch(array, 2, comparator, len * 2, array.length - 1, len), len * 2);
          t.is(binarySearch(array, 3, comparator, len * 3, array.length - 1, len), len * 3);

          push(array, 4);
          t.is(binarySearch(array, 0, comparator, len * 0, array.length - 1, len), len * 0);
          t.is(binarySearch(array, 1, comparator, len * 1, array.length - 1, len), len * 1);
          t.is(binarySearch(array, 2, comparator, len * 2, array.length - 1, len), len * 2);
          t.is(binarySearch(array, 3, comparator, len * 3, array.length - 1, len), len * 3);
          t.is(binarySearch(array, 4, comparator, len * 4, array.length - 1, len), len * 4);

          push(array, 5);
          t.is(binarySearch(array, 0, comparator, len * 0, array.length - 1, len), len * 0);
          t.is(binarySearch(array, 1, comparator, len * 1, array.length - 1, len), len * 1);
          t.is(binarySearch(array, 2, comparator, len * 2, array.length - 1, len), len * 2);
          t.is(binarySearch(array, 3, comparator, len * 3, array.length - 1, len), len * 3);
          t.is(binarySearch(array, 4, comparator, len * 4, array.length - 1, len), len * 4);
          t.is(binarySearch(array, 5, comparator, len * 5, array.length - 1, len), len * 5);
        });

        test('low higher than needle index returns left of high', (t) => {
          const array: number[] = [];

          push(array, 0);

          push(array, 1);
          t.is(binarySearch(array, 0, comparator, len * 1, array.length - 1, len), len * 0);

          push(array, 2);
          t.is(binarySearch(array, 0, comparator, len * 1, array.length - 1, len), len * 0);
          t.is(binarySearch(array, 0, comparator, len * 2, array.length - 1, len), len * 1);
          t.is(binarySearch(array, 1, comparator, len * 2, array.length - 1, len), len * 1);

          push(array, 3);
          t.is(binarySearch(array, 0, comparator, len * 1, array.length - 1, len), len * 0);
          t.is(binarySearch(array, 0, comparator, len * 2, array.length - 1, len), len * 1);
          t.is(binarySearch(array, 0, comparator, len * 3, array.length - 1, len), len * 2);
          t.is(binarySearch(array, 1, comparator, len * 2, array.length - 1, len), len * 1);
          t.is(binarySearch(array, 1, comparator, len * 3, array.length - 1, len), len * 2);
          t.is(binarySearch(array, 2, comparator, len * 3, array.length - 1, len), len * 2);

          push(array, 4);
          t.is(binarySearch(array, 0, comparator, len * 1, array.length - 1, len), len * 0);
          t.is(binarySearch(array, 0, comparator, len * 2, array.length - 1, len), len * 1);
          t.is(binarySearch(array, 0, comparator, len * 3, array.length - 1, len), len * 2);
          t.is(binarySearch(array, 0, comparator, len * 4, array.length - 1, len), len * 3);
          t.is(binarySearch(array, 1, comparator, len * 2, array.length - 1, len), len * 1);
          t.is(binarySearch(array, 1, comparator, len * 3, array.length - 1, len), len * 2);
          t.is(binarySearch(array, 1, comparator, len * 4, array.length - 1, len), len * 3);
          t.is(binarySearch(array, 2, comparator, len * 3, array.length - 1, len), len * 2);
          t.is(binarySearch(array, 2, comparator, len * 4, array.length - 1, len), len * 3);
          t.is(binarySearch(array, 3, comparator, len * 4, array.length - 1, len), len * 3);
        });

        test('low lower than needle index returns needle index', (t) => {
          const array: number[] = [];

          push(array, 0);

          push(array, 1);
          t.is(binarySearch(array, 1, comparator, len * 0, array.length - 1, len), len * 1);

          push(array, 2);
          t.is(binarySearch(array, 1, comparator, len * 0, array.length - 1, len), len * 1);
          t.is(binarySearch(array, 2, comparator, len * 0, array.length - 1, len), len * 2);
          t.is(binarySearch(array, 2, comparator, len * 1, array.length - 1, len), len * 2);

          push(array, 3);
          t.is(binarySearch(array, 1, comparator, len * 0, array.length - 1, len), len * 1);
          t.is(binarySearch(array, 2, comparator, len * 0, array.length - 1, len), len * 2);
          t.is(binarySearch(array, 2, comparator, len * 1, array.length - 1, len), len * 2);
          t.is(binarySearch(array, 3, comparator, len * 0, array.length - 1, len), len * 3);
          t.is(binarySearch(array, 3, comparator, len * 1, array.length - 1, len), len * 3);
          t.is(binarySearch(array, 3, comparator, len * 2, array.length - 1, len), len * 3);

          push(array, 4);
          t.is(binarySearch(array, 1, comparator, len * 0, array.length - 1, len), len * 1);
          t.is(binarySearch(array, 2, comparator, len * 0, array.length - 1, len), len * 2);
          t.is(binarySearch(array, 2, comparator, len * 1, array.length - 1, len), len * 2);
          t.is(binarySearch(array, 3, comparator, len * 0, array.length - 1, len), len * 3);
          t.is(binarySearch(array, 3, comparator, len * 1, array.length - 1, len), len * 3);
          t.is(binarySearch(array, 3, comparator, len * 2, array.length - 1, len), len * 3);
          t.is(binarySearch(array, 4, comparator, len * 0, array.length - 1, len), len * 4);
          t.is(binarySearch(array, 4, comparator, len * 1, array.length - 1, len), len * 4);
          t.is(binarySearch(array, 4, comparator, len * 2, array.length - 1, len), len * 4);
          t.is(binarySearch(array, 4, comparator, len * 3, array.length - 1, len), len * 4);
        });
      });

      describe('high', () => {
        test('high equals needle index returns needle index', (t) => {
          const array: number[] = [];

          push(array, 0);
          t.is(binarySearch(array, 0, comparator, 0, len * 0, len), len * 0);

          push(array, 1);
          t.is(binarySearch(array, 0, comparator, 0, len * 0, len), len * 0);
          t.is(binarySearch(array, 1, comparator, 0, len * 1, len), len * 1);

          push(array, 2);
          t.is(binarySearch(array, 0, comparator, 0, len * 0, len), len * 0);
          t.is(binarySearch(array, 1, comparator, 0, len * 1, len), len * 1);
          t.is(binarySearch(array, 2, comparator, 0, len * 2, len), len * 2);

          push(array, 3);
          t.is(binarySearch(array, 0, comparator, 0, len * 0, len), len * 0);
          t.is(binarySearch(array, 1, comparator, 0, len * 1, len), len * 1);
          t.is(binarySearch(array, 2, comparator, 0, len * 2, len), len * 2);
          t.is(binarySearch(array, 3, comparator, 0, len * 3, len), len * 3);

          push(array, 4);
          t.is(binarySearch(array, 0, comparator, 0, len * 0, len), len * 0);
          t.is(binarySearch(array, 1, comparator, 0, len * 1, len), len * 1);
          t.is(binarySearch(array, 2, comparator, 0, len * 2, len), len * 2);
          t.is(binarySearch(array, 3, comparator, 0, len * 3, len), len * 3);
          t.is(binarySearch(array, 4, comparator, 0, len * 4, len), len * 4);

          push(array, 5);
          t.is(binarySearch(array, 0, comparator, 0, len * 0, len), len * 0);
          t.is(binarySearch(array, 1, comparator, 0, len * 1, len), len * 1);
          t.is(binarySearch(array, 2, comparator, 0, len * 2, len), len * 2);
          t.is(binarySearch(array, 3, comparator, 0, len * 3, len), len * 3);
          t.is(binarySearch(array, 4, comparator, 0, len * 4, len), len * 4);
          t.is(binarySearch(array, 5, comparator, 0, len * 5, len), len * 5);
        });

        test('high higher than needle index returns needle index', (t) => {
          const array: number[] = [];

          push(array, 0);

          push(array, 1);
          t.is(binarySearch(array, 0, comparator, 0, len * 1, len), len * 0);

          push(array, 2);
          t.is(binarySearch(array, 0, comparator, 0, len * 1, len), len * 0);
          t.is(binarySearch(array, 0, comparator, 0, len * 2, len), len * 0);
          t.is(binarySearch(array, 1, comparator, 0, len * 2, len), len * 1);

          push(array, 3);
          t.is(binarySearch(array, 0, comparator, 0, len * 1, len), len * 0);
          t.is(binarySearch(array, 0, comparator, 0, len * 2, len), len * 0);
          t.is(binarySearch(array, 0, comparator, 0, len * 3, len), len * 0);
          t.is(binarySearch(array, 1, comparator, 0, len * 2, len), len * 1);
          t.is(binarySearch(array, 1, comparator, 0, len * 3, len), len * 1);
          t.is(binarySearch(array, 2, comparator, 0, len * 3, len), len * 2);

          push(array, 4);
          t.is(binarySearch(array, 0, comparator, 0, len * 1, len), len * 0);
          t.is(binarySearch(array, 0, comparator, 0, len * 2, len), len * 0);
          t.is(binarySearch(array, 0, comparator, 0, len * 3, len), len * 0);
          t.is(binarySearch(array, 0, comparator, 0, len * 4, len), len * 0);
          t.is(binarySearch(array, 1, comparator, 0, len * 2, len), len * 1);
          t.is(binarySearch(array, 1, comparator, 0, len * 3, len), len * 1);
          t.is(binarySearch(array, 1, comparator, 0, len * 4, len), len * 1);
          t.is(binarySearch(array, 2, comparator, 0, len * 3, len), len * 2);
          t.is(binarySearch(array, 2, comparator, 0, len * 4, len), len * 2);
          t.is(binarySearch(array, 3, comparator, 0, len * 4, len), len * 3);
        });

        test('high lower than needle index returns high', (t) => {
          const array: number[] = [];

          push(array, 0);

          push(array, 1);
          t.is(binarySearch(array, 1, comparator, 0, len * 0, len), len * 0);

          push(array, 2);
          t.is(binarySearch(array, 1, comparator, 0, len * 0, len), len * 0);
          t.is(binarySearch(array, 2, comparator, 0, len * 0, len), len * 0);
          t.is(binarySearch(array, 2, comparator, 0, len * 1, len), len * 1);

          push(array, 3);
          t.is(binarySearch(array, 1, comparator, 0, len * 0, len), len * 0);
          t.is(binarySearch(array, 2, comparator, 0, len * 0, len), len * 0);
          t.is(binarySearch(array, 2, comparator, 0, len * 1, len), len * 1);
          t.is(binarySearch(array, 3, comparator, 0, len * 0, len), len * 0);
          t.is(binarySearch(array, 3, comparator, 0, len * 1, len), len * 1);
          t.is(binarySearch(array, 3, comparator, 0, len * 2, len), len * 2);

          push(array, 4);
          t.is(binarySearch(array, 1, comparator, 0, len * 0, len), len * 0);
          t.is(binarySearch(array, 2, comparator, 0, len * 0, len), len * 0);
          t.is(binarySearch(array, 2, comparator, 0, len * 1, len), len * 1);
          t.is(binarySearch(array, 3, comparator, 0, len * 0, len), len * 0);
          t.is(binarySearch(array, 3, comparator, 0, len * 1, len), len * 1);
          t.is(binarySearch(array, 3, comparator, 0, len * 2, len), len * 2);
          t.is(binarySearch(array, 4, comparator, 0, len * 0, len), len * 0);
          t.is(binarySearch(array, 4, comparator, 0, len * 1, len), len * 1);
          t.is(binarySearch(array, 4, comparator, 0, len * 2, len), len * 2);
          t.is(binarySearch(array, 4, comparator, 0, len * 3, len), len * 3);
        });
      });
    };
  }

  describe('single grouping', suite(1));
  describe('5-tuple grouping', suite(5));
});
