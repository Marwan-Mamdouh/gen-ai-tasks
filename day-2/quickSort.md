# quickSortEnhanced — Implementation Notes

This document explains the `quickSortEnhanced` implementation found in `task2.js`. It describes what the function does, how it works, and the key components and decisions.

## Purpose

- A flexible QuickSort implementation with options:
  - `comparator` — custom comparison function (a, b) => negative/zero/positive
  - `inPlace` — if `true`, sort mutates the original array; otherwise returns a sorted copy
  - `stable` — if `true`, perform a stable sort by tagging items with original indices
  - `pivot` — pivot selection strategy: `'random' | 'median3' | 'first' | 'last'` (default `'random'`)

## High-level behavior

1. Validate input (throws `TypeError` if input is `null`/`undefined`).
2. Build a working array from the input:
   - If `inPlace` and the input is an actual Array, operate on it directly.
   - Otherwise create a new Array via `Array.from(input)` (supports iterables / array-like).
3. If `stable` is requested, wrap each element as `{ v, i }` to preserve original indices for tie-breaking.
4. Use an iterative stack-based quicksort loop to avoid recursion.
5. Partition each range using 3-way (Dutch National Flag) partitioning around a chosen pivot.
6. Push subranges back onto stack; push the larger partition first to keep stack depth small.
7. Unwrap stable tags if needed and return either the in-place array or a shallow copy (non-mutating by default).

## Key components

- Comparator (`userCmp` / `cmp`)

  - `userCmp` is the user-supplied comparator or a default comparator for natural ordering.
  - `cmp` wraps `userCmp` and, when `stable` is enabled, uses the original index as a tie-breaker:
    - if `userCmp(x,y) !== 0` return that result
    - else return `x.i - y.i` to preserve input order for equal items

- Input preparation

  - `Array.from(input)` ensures iterables and array-like objects are supported.
  - If `inPlace` is true and the input is an actual Array, the function sorts that array directly.

- Stable tagging

  - When `stable` is true, elements become `{ v, i }`.
  - `i` is the original index and is used only for tie-breaks in `cmp`.
  - After sorting, the implementation maps back to raw values via `arr.map(({ v }) => v)`.

- Pivot selection (`choosePivotIndex`)

  - `random` (default): pick uniformly from range.
  - `first` / `last`: deterministic choice of endpoints.
  - `median3`: attempts to select the median of `arr[lo]`, `arr[mid]`, `arr[hi]` (improves pivot quality for partially ordered inputs).

- 3-way partitioning (Dutch National Flag)

  - Pointers: `lt` (end of less-than region), `i` (current), `gt` (start of greater-than region).
  - While `i <= gt`:
    - if `cmp(arr[i], pivot) < 0` swap(arr[lt], arr[i]); lt++; i++;
    - else if `cmp(arr[i], pivot) > 0` swap(arr[i], arr[gt]); gt--;
    - else i++ (equal region)
  - Result: elements < pivot in [lo..lt-1], == pivot in [lt..gt], > pivot in [gt+1..hi]

- Iterative stack and stack-depth control

  - Use a stack of `[lo, hi]` ranges instead of recursion.
  - After partitioning, push the larger subrange first: this keeps the stack height O(log n) on average.

- Swap helper
  - Simple element exchange `arr[i] <-> arr[j]`.

## Complexity and guarantees

- Average time: O(n log n)
- Average extra space: O(log n) stack (iterative) + O(n) if `stable` tagging is used; `inPlace` can avoid the array copy (if input is real Array).
- Worst-case time: O(n^2) with adversarial pivots — mitigated by random or median-of-three pivot strategies.
- Stability:
  - Default is unstable (like standard Quicksort).
  - `stable: true` enforces stability via tagging, but this increases memory and comparison overhead.

## Edge cases and return behavior

- If `input == null` -> throws `TypeError`.
- If `n <= 1` -> returns input (unwrapped if `stable`).
- If non-mutating default: returns a shallow copy of the sorted array.
- If `inPlace: true` and input is an `Array`, returns the same (now-sorted) array reference.
- Works with arbitrary values provided the comparator can compare them.

## Export

- CommonJS export is provided for Node.js: `module.exports = quickSortEnhanced`.

## Example usage

```js
const sorted = quickSortEnhanced([3, 6, 1, 5, 2, 4]); // non-mutating
quickSortEnhanced(arr, { inPlace: true, pivot: "median3" }); // sorts arr
quickSortEnhanced(objects, { comparator: (a, b) => a.v - b.v, stable: true });
```

## Implementation notes / possible improvements

- For very small ranges, switching to insertion sort can improve performance.
- For strict memory budgets, avoid `stable` option or implement an in-place stable algorithm (more complex).
- The median-of-3 selector could be refined to ensure correct median selection in all comparator cases.
