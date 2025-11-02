/**
 * quickSort(array, [comparator]) -> returns a new sorted array
 * - non-mutating (returns a sorted copy)
 * - accepts an optional comparator(a, b) returning negative/zero/positive
 * - uses randomized pivot + 3-way partitioning for performance with duplicates
 * - iterative to avoid deep recursion
 */
function quickSort(input, comparator) {
  const cmp =
    typeof comparator === "function"
      ? comparator
      : (a, b) => (a < b ? -1 : a > b ? 1 : 0);

  // copy the input to avoid mutation; support array-like inputs
  const a = Array.isArray(input) ? input.slice() : Array.from(input);
  const n = a.length;
  if (n <= 1) return a;

  const swap = (i, j) => {
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  };

  // stack of [lo, hi] ranges to sort
  const stack = [[0, n - 1]];

  while (stack.length) {
    const [lo, hi] = stack.pop();
    if (lo >= hi) continue;

    // choose random pivot and partition into < pivot, == pivot, > pivot
    const pivotIndex = lo + Math.floor(Math.random() * (hi - lo + 1));
    const pivot = a[pivotIndex];

    let i = lo,
      lt = lo,
      gt = hi;
    while (i <= gt) {
      const res = cmp(a[i], pivot);
      if (res < 0) {
        swap(lt, i);
        lt++;
        i++;
      } else if (res > 0) {
        swap(i, gt);
        gt--;
      } else {
        i++;
      }
    }

    // push subranges that still need sorting
    if (lt - lo > 1) stack.push([lo, lt - 1]);
    if (hi - gt > 1) stack.push([gt + 1, hi]);
  }

  return a;
}

// Export for Node.js / CommonJS environments
if (typeof module !== "undefined" && module.exports) {
  module.exports = quickSort;
}

// Usage examples (uncomment to run)
// console.log(quickSort([3, 6, 1, 5, 2, 4]));
// console.log(quickSort(['d','a','c','b']));
// console.log(quickSort([{v:3},{v:1}], (x,y) => x.v - y.v));
