import binarySearch from '../src/binary-search';
import { test, describe } from './setup';

describe('binary search', () => {
  function comparator(item: number, needle: number): number {
    return item - needle;
  }

  test('returns index of match', (t) => {
    const array: number[] = [];
    for (let i = 0; i < 9; i++) {
      array.push(i * 2);
      for (let j = 0; j < array.length; j++) {
        const needle = j * 2;
        const index = binarySearch(array, needle, comparator, 0, array.length - 1);

        t.is(index, j);

        t.is(array[index], needle);
      }
    }
  });

  test('returns negated index for non-match', (t) => {
    // Test middles, which have a number left and right of index.
    const array: number[] = [];
    for (let i = 0; i < 9; i++) {
      array.push(i * 2);
      for (let j = 0; j < array.length; j++) {
        const needle = j * 2 - 1;
        const index = binarySearch(array, needle, comparator, 0, array.length - 1);
        const negated = ~index;

        t.assert(index < 0);
        t.is(negated, j);

        if (negated > 0) {
          t.assert(array[negated - 1] < needle);
        }
        if (negated < array.length) {
          t.assert(array[negated] > needle);
        }
      }
    }
  });

  test('needle is lower than all elements', (t) => {
    const array: number[] = [];
    const needle = -1;

    for (let i = 0; i < 9; i++) {
      array.push(i * 2);
      const index = binarySearch(array, needle, comparator, 0, array.length - 1);
      const negated = ~index;

      t.assert(index < 0);
      t.is(negated, 0);
      t.assert(array[negated] > needle);
    }
  });

  test('needle is higher than all elements', (t) => {
    const array: number[] = [];
    const needle = 18;

    for (let i = 0; i < 9; i++) {
      array.push(i * 2);
      const index = binarySearch(array, needle, comparator, 0, array.length - 1);
      const negated = ~index;

      t.assert(index < 0);
      t.is(negated, array.length);
      t.assert(array[negated - 1] < needle);
    }
  });

  test('empty array', (t) => {
    const array: number[] = [];
    const needle = 1;
    const index = binarySearch(array, needle, comparator, 0, array.length - 1);

    t.assert(index < 0);
    t.is(~index, 0);
  });

  test('multiple items in array returns valid matches', (t) => {
    const array: number[] = [1];
    const needle = 1;
    const expectedIndex = 0;

    let attempts = 0;
    for (; attempts < 10; attempts++) {
      array.push(needle);

      const index = binarySearch(array, needle, comparator, 0, array.length - 1);
      if (index !== expectedIndex) break;
    }

    t.assert(attempts < 10);
  });

  describe('low', () => {
    test('low equals needle index', (t) => {
      const array: number[] = [];
      for (let i = 0; i < 9; i++) {
        array.push(i * 2);
        for (let j = 0; j < array.length; j++) {
          const needle = j * 2;
          const index = binarySearch(array, needle, comparator, j, array.length - 1);

          t.is(index, j);

          t.is(array[index], needle);
        }
      }
    });

    test('low higher than needle index', (t) => {
      const array: number[] = [];
      for (let i = 0; i < 9; i++) {
        array.push(i * 2);
        for (let j = 0; j < array.length; j++) {
          const needle = j * 2;
          const index = binarySearch(array, needle, comparator, j + 1, array.length - 1);
          const negated = ~index;

          t.assert(index < 0);
          t.is(negated, j + 1);
        }
      }
    });

    test('low lower than needle index', (t) => {
      const array: number[] = [];
      for (let i = 0; i < 9; i++) {
        array.push(i * 2);
        for (let j = 0; j < array.length; j++) {
          const needle = j * 2;
          const index = binarySearch(array, needle, comparator, j - 1, array.length - 1);

          t.is(index, j);
        }
      }
    });

    test('low equals -1', (t) => {
      const array: number[] = [];
      Object.defineProperty(array, '-1', {
        get() {
          throw new Error('access to negative index');
        },
      });

      for (let i = 0; i < 9; i++) {
        array.push(i * 2);
        for (let j = 0; j < array.length; j++) {
          const needle = j * 2;
          const index = binarySearch(array, needle, comparator, -1, array.length - 1);

          t.is(index, j);
        }
      }
    });
  });

  describe('high', () => {
    test('high equals needle index', (t) => {
      const array: number[] = [];
      for (let i = 0; i < 9; i++) {
        array.push(i * 2);
        for (let j = 0; j < array.length; j++) {
          const needle = j * 2;
          const index = binarySearch(array, needle, comparator, 0, j);

          t.is(index, j);

          t.is(array[index], needle);
        }
      }
    });

    test('high higher than needle index', (t) => {
      const array: number[] = [];
      for (let i = 0; i < 9; i++) {
        array.push(i * 2);
        for (let j = 0; j < array.length; j++) {
          const needle = j * 2;
          const index = binarySearch(array, needle, comparator, 0, j + 1);

          t.is(index, j);
        }
      }
    });

    test('high lower than needle index', (t) => {
      const array: number[] = [];
      for (let i = 0; i < 9; i++) {
        array.push(i * 2);
        for (let j = 0; j < array.length; j++) {
          const needle = j * 2;
          const index = binarySearch(array, needle, comparator, 0, j - 1);
          const negated = ~index;

          t.assert(index < 0);
          t.is(negated, j);
        }
      }
    });

    test('high equals -1', (t) => {
      const array: number[] = [];
      Object.defineProperty(array, '-1', {
        get() {
          throw new Error('access to negative index');
        },
      });

      for (let i = 0; i < 9; i++) {
        array.push(i * 2);
        for (let j = 0; j < array.length; j++) {
          const needle = j * 2;
          const index = binarySearch(array, needle, comparator, 0, -1);

          t.is(index, -1);
        }
      }
    });
  });
});
