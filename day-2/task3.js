// ...existing code...
/**
 * Enhanced quickSort with options:
 * - comparator: function(a, b) -> negative/zero/positive
 * - inPlace: boolean (default false) — whether to sort the input array in-place
 * - stable: boolean (default false) — stable sort (adds index tie-breaker)
 * - pivot: 'random' | 'median3' | 'first' | 'last' (default 'random')
 *
 * Improvements in this version:
 * - insertion sort for small ranges (improves constant factors)
 * - improved median-of-three selection
 * - stable + inPlace handled without corrupting original items
 * - avoids unnecessary final array copies
 * - iterative 3-way partition with stack-size control
 */
function quickSortEnhanced(input, options = {}) {
  const {
    comparator,
    inPlace = false,
    stable = false,
    pivot = "random",
  } = options || {};

  if (input == null) throw new TypeError("input must be an array or iterable");

  const userCmp =
    typeof comparator === "function"
      ? comparator
      : (a, b) => (a < b ? -1 : a > b ? 1 : 0);

  // Threshold for switching to insertion sort
  const INSERTION_SORT_THRESHOLD = 16;

  // Prepare working array(s):
  // - If stable is requested, build a wrapper array so we can tie-break by original index
  // - If inPlace requested and input is an actual Array and stable is false, operate on it directly
  const srcIsArray = Array.isArray(input);
  let working;
  if (stable) {
    // always create a wrapper array for stable sorting to preserve original values & indices
    const base = srcIsArray ? input : Array.from(input);
    working = base.map((v, i) => ({ v, i }));
  } else {
    working = inPlace && srcIsArray ? input : Array.from(input);
  }

  // cmp handles wrapped items when stable=true
  const cmp = (x, y) => {
    const vx = stable ? x.v : x;
    const vy = stable ? y.v : y;
    const r = userCmp(vx, vy);
    if (r !== 0) return r;
    if (!stable) return 0;
    return x.i - y.i; // tie-break
  };

  const n = working.length;
  if (n <= 1) {
    // if stable, unwrap if user didn't ask for in-place mutation of original array
    if (stable && !inPlace) return working.map(({ v }) => v);
    if (stable && inPlace && srcIsArray) {
      // copy back into original array
      const out = working.map(({ v }) => v);
      for (let i = 0; i < out.length; i++) input[i] = out[i];
      return input;
    }
    return working;
  }

  const swap = (arr, i, j) => {
    const t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
  };

  const insertionSort = (arr, lo, hi, cmpFn) => {
    for (let i = lo + 1; i <= hi; i++) {
      let j = i;
      const tmp = arr[i];
      while (j > lo && cmpFn(arr[j - 1], tmp) > 0) {
        arr[j] = arr[j - 1];
        j--;
      }
      arr[j] = tmp;
    }
  };

  const choosePivotIndex = (arr, lo, hi) => {
    if (pivot === "first") return lo;
    if (pivot === "last") return hi;
    if (pivot === "median3") {
      const mid = lo + ((hi - lo) >> 1);
      const aVal = arr[lo],
        bVal = arr[mid],
        cVal = arr[hi];
      // robust median-of-three using cmp
      if (cmp(aVal, bVal) <= 0) {
        // a <= b
        if (cmp(bVal, cVal) <= 0) return mid; // a <= b <= c -> b
        if (cmp(aVal, cVal) <= 0) return hi; // a <= c < b -> c
        return lo; // c < a <= b -> a
      } else {
        // b < a
        if (cmp(aVal, cVal) <= 0) return lo; // b < a <= c -> a
        if (cmp(bVal, cVal) <= 0) return hi; // b <= c < a -> c
        return mid; // c < b < a -> b
      }
    }
    // random
    return lo + Math.floor(Math.random() * (hi - lo + 1));
  };

  // iterative stack of ranges
  const stack = [[0, n - 1]];
  while (stack.length) {
    const [lo, hi] = stack.pop();
    if (lo >= hi) continue;

    // use insertion sort for small ranges
    if (hi - lo <= INSERTION_SORT_THRESHOLD) {
      insertionSort(working, lo, hi, cmp);
      continue;
    }

    const pIdx = choosePivotIndex(working, lo, hi);
    const pivotVal = working[pIdx];

    // 3-way partitioning (Dutch national flag)
    let i = lo,
      lt = lo,
      gt = hi;
    while (i <= gt) {
      const r = cmp(working[i], pivotVal);
      if (r < 0) {
        swap(working, lt++, i++);
      } else if (r > 0) {
        swap(working, i, gt--);
      } else {
        i++;
      }
    }

    // push larger partition first to keep stack shallow
    const leftSize = lt - lo;
    const rightSize = hi - gt;
    if (leftSize < rightSize) {
      if (gt + 1 < hi) stack.push([gt + 1, hi]);
      if (lo < lt - 1) stack.push([lo, lt - 1]);
    } else {
      if (lo < lt - 1) stack.push([lo, lt - 1]);
      if (gt + 1 < hi) stack.push([gt + 1, hi]);
    }
  }

  // Build final result and respect inPlace option
  if (stable) {
    const out = working.map(({ v }) => v);
    if (inPlace && srcIsArray) {
      // copy sorted values back into original array
      for (let k = 0; k < out.length; k++) input[k] = out[k];
      return input;
    }
    return out;
  } else {
    // working already references input when inPlace && srcIsArray
    return working;
  }
}

// CommonJS export
if (typeof module !== "undefined" && module.exports) {
  module.exports = quickSortEnhanced;
}
