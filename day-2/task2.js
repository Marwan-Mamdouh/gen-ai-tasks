/**
 * Enhanced quickSort with options:
 * - comparator: function(a, b) -> negative/zero/positive
 * - inPlace: boolean (default false) — whether to sort the input array in-place
 * - stable: boolean (default false) — stable sort (adds index tie-breaker)
 * - pivot: 'random' | 'median3' | 'first' | 'last' (default 'random')
 *
 * Non-mutating by default. Uses iterative 3-way partitioning and randomized or median-of-3 pivot.
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

  // Prepare array: support array-like/iterable inputs
  const srcIsArray = Array.isArray(input);
  const a = inPlace && srcIsArray ? input : Array.from(input);

  // For stable sort, tag elements with original index so ties are deterministic
  const arr = stable ? a.map((v, i) => ({ v, i })) : a;

  const cmp = (x, y) => {
    const vx = stable ? x.v : x;
    const vy = stable ? y.v : y;
    const r = userCmp(vx, vy);
    if (r !== 0) return r;
    if (!stable) return 0;
    // tie-breaker by original index for stability
    return x.i - y.i;
  };

  const n = arr.length;
  if (n <= 1) return stable ? arr.map(({ v }) => v) : arr;

  const swap = (i, j) => {
    const t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
  };

  const choosePivotIndex = (lo, hi) => {
    if (pivot === "first") return lo;
    if (pivot === "last") return hi;
    if (pivot === "median3") {
      const mid = lo + ((hi - lo) >> 1);
      // median of arr[lo], arr[mid], arr[hi]
      const aVal = arr[lo],
        bVal = arr[mid],
        cVal = arr[hi];
      const ab = cmp(aVal, bVal);
      const ac = cmp(aVal, cVal);
      const bc = cmp(bVal, cVal);
      if (ab <= 0 && bc <= 0) return mid; // a <= b <= c -> mid
      if (ab >= 0 && ac <= 0) return lo; // b <= a <= c -> lo
      return hi; // otherwise hi is median
    }
    // default random
    return lo + Math.floor(Math.random() * (hi - lo + 1));
  };

  // iterative stack of ranges
  const stack = [[0, n - 1]];
  while (stack.length) {
    const [lo, hi] = stack.pop();
    if (lo >= hi) continue;

    const pIdx = choosePivotIndex(lo, hi);
    const pivotVal = arr[pIdx];

    // 3-way partitioning
    let i = lo,
      lt = lo,
      gt = hi;
    while (i <= gt) {
      const r = cmp(arr[i], pivotVal);
      if (r < 0) {
        swap(lt++, i++);
      } else if (r > 0) {
        swap(i, gt--);
      } else {
        i++;
      }
    }

    // Push larger partition first to keep stack shallow
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

  const result = stable ? arr.map(({ v }) => v) : arr;
  return inPlace && srcIsArray
    ? result
    : Array.isArray(result)
    ? result.slice()
    : result;
}

// CommonJS export
if (typeof module !== "undefined" && module.exports) {
  module.exports = quickSortEnhanced;
}

// Usage examples:
// const arr = [3,6,1,5,2,4];
// console.log(quickSortEnhanced(arr)); // non-mutating
// console.log(quickSortEnhanced(arr, { inPlace: true, pivot: 'median3' })); // mutates arr
// console.log(quickSortEnhanced([{v:2},{v:1}], { comparator: (a,b)=>a.v-b.v, stable: true }));
