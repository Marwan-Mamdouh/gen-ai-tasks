// Simple test runner for quickSortEnhanced (task3.js)

"use strict";

const assert = require("assert");
const quickSortEnhanced = require("./task3.js");

function runTest(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (err) {
    console.error(`✗ ${name}`);
    console.error(err && err.stack ? err.stack : err);
    process.exitCode = 1;
  }
}

/* Helpers */
const randInt = (max) => Math.floor(Math.random() * max);

function arraysEqual(a, b) {
  try {
    assert.deepStrictEqual(a, b);
    return true;
  } catch {
    return false;
  }
}

/* Tests */

runTest("throws on null/undefined input", () => {
  assert.throws(() => quickSortEnhanced(null), TypeError);
  assert.throws(() => quickSortEnhanced(undefined), TypeError);
});

runTest("empty array", () => {
  const input = [];
  const out = quickSortEnhanced(input);
  assert(Array.isArray(out));
  assert.strictEqual(out.length, 0);
  // non-mutating by default
  assert.notStrictEqual(out, input);
  assert.strictEqual(input.length, 0);
});

runTest("single element", () => {
  const input = [42];
  const out = quickSortEnhanced(input);
  assert.deepStrictEqual(out, [42]);
  assert.notStrictEqual(out, input);
});

runTest("already sorted array remains sorted", () => {
  const input = [1, 2, 3, 4, 5];
  const out = quickSortEnhanced(input);
  assert.deepStrictEqual(out, [1, 2, 3, 4, 5]);
});

runTest("reverse sorted array", () => {
  const input = [5, 4, 3, 2, 1];
  const expected = [1, 2, 3, 4, 5];
  const out = quickSortEnhanced(input);
  assert.deepStrictEqual(out, expected);
});

runTest("duplicates handled correctly (3-way partitioning)", () => {
  const input = [2, 3, 2, 1, 2, 3, 1];
  const expected = [...input].sort((a, b) => a - b);
  const out = quickSortEnhanced(input);
  assert.deepStrictEqual(out, expected);
});

runTest("custom comparator with objects", () => {
  const input = [{ v: 3 }, { v: 1 }, { v: 2 }];
  const expected = input.slice().sort((a, b) => a.v - b.v);
  const out = quickSortEnhanced(input, { comparator: (a, b) => a.v - b.v });
  assert.deepStrictEqual(out, expected);
});

runTest(
  "inPlace: true mutates original array and returns same reference",
  () => {
    const arr = [3, 1, 2];
    const ref = arr;
    const out = quickSortEnhanced(arr, { inPlace: true });
    assert.strictEqual(out, ref, "should return same array reference");
    assert.deepStrictEqual(arr, [1, 2, 3]);
  }
);

runTest("non-mutating default leaves original unchanged", () => {
  const arr = [4, 2, 5, 1];
  const copy = arr.slice();
  const out = quickSortEnhanced(arr);
  assert.notStrictEqual(out, arr);
  assert.deepStrictEqual(arr, copy);
  assert.deepStrictEqual(
    out,
    copy.slice().sort((a, b) => a - b)
  );
});

runTest("stable: true preserves relative order of equal keys", () => {
  const input = [];
  // create groups with equal key and track original order via id
  for (let k = 0; k < 5; k++) {
    for (let i = 0; i < 4; i++) {
      input.push({ key: k, id: k * 10 + i });
    }
  }
  // shuffle slightly to make sure algorithm can't rely on original runs
  const shuffled = input.slice().sort(() => Math.random() - 0.5);

  const sortedStable = quickSortEnhanced(shuffled, {
    comparator: (a, b) => a.key - b.key,
    stable: true,
  });

  // For each key, ids should be in ascending order (relative to initial shuffled order),
  // but since stable sort should preserve relative positions from shuffled array,
  // we check that within each key the sequence of ids follows the order they appeared in shuffled.
  const orderMap = new Map(); // key -> array of ids in the shuffled order
  for (const item of shuffled) {
    const arr = orderMap.get(item.key) || [];
    arr.push(item.id);
    orderMap.set(item.key, arr);
  }

  for (const key of orderMap.keys()) {
    const expectedIds = orderMap.get(key);
    const actualIds = sortedStable
      .filter((x) => x.key === key)
      .map((x) => x.id);
    assert.deepStrictEqual(
      actualIds,
      expectedIds,
      `stable order broken for key=${key}`
    );
  }
});

runTest("stable + inPlace: true copies back into original array", () => {
  const arr = [
    { key: 1, id: 0 },
    { key: 0, id: 1 },
    { key: 1, id: 2 },
    { key: 0, id: 3 },
  ];
  const originalRef = arr;
  const out = quickSortEnhanced(arr, {
    comparator: (a, b) => a.key - b.key,
    stable: true,
    inPlace: true,
  });
  assert.strictEqual(out, originalRef);
  // after stable sort by key, items with key=0 should appear before key=1
  assert.strictEqual(arr[0].key, 0);
  assert.strictEqual(arr[1].key, 0);
  assert.strictEqual(arr[2].key, 1);
  assert.strictEqual(arr[3].key, 1);
  // within same key, stability preserved relative to original order:
  // original key=0 items were id 1 then id 3 -> should remain in that order
  const key0ids = arr.filter((x) => x.key === 0).map((x) => x.id);
  assert.deepStrictEqual(key0ids, [1, 3]);
});

runTest("pivot strategy: median3 does not break correctness", () => {
  const arr = [];
  for (let i = 0; i < 200; i++) arr.push(randInt(1000));
  const expected = arr.slice().sort((a, b) => a - b);
  const out = quickSortEnhanced(arr, { pivot: "median3" });
  assert.deepStrictEqual(out, expected);
});

runTest("large random dataset correctness (10k items)", () => {
  const N = 10000;
  const arr = new Array(N);
  for (let i = 0; i < N; i++) arr[i] = randInt(1000000) - 500000;
  const expected = arr.slice().sort((a, b) => a - b);
  const out = quickSortEnhanced(arr);
  assert.strictEqual(out.length, expected.length);
  assert.ok(arraysEqual(out, expected), "large dataset sort mismatch");
});

runTest("large dataset performance sanity (no crash) with duplicates", () => {
  // ensure algorithm handles many duplicates efficiently
  const N = 20000;
  const arr = new Array(N);
  for (let i = 0; i < N; i++) arr[i] = i % 5; // many duplicates
  const out = quickSortEnhanced(arr);
  // should be sorted: 0..4 repeated
  for (let i = 1; i < out.length; i++) {
    assert.ok(out[i - 1] <= out[i], "not non-decreasing");
  }
});

if (process.exitCode === 0 || process.exitCode === undefined) {
  console.log("All tests completed.");
} else {
  console.error("Some tests failed.");
}

/* Run:
   From repository root (Linux):
   node /mnt/work-and-learn/coding/iti/assignments/ai/day-2/task4.js
*/
