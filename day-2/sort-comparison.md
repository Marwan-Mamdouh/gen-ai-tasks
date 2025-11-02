# Comparison: QuickSort vs MergeSort vs HeapSort vs JavaScript built-in sort

This document summarizes algorithmic properties, trade-offs, and practical recommendations when choosing between QuickSort, MergeSort, HeapSort, and the JavaScript built-in Array.prototype.sort.

## Quick summary table

- Time complexity (avg / worst / best)
- Space
- Stability
- In-place?
- Typical use-case

| Algorithm / Method |                               Avg time |                 Worst time |               Best time |                                                Extra space |                           Stable |                              In-place | Notes                                                                                                                         |
| ------------------ | -------------------------------------: | -------------------------: | ----------------------: | ---------------------------------------------------------: | -------------------------------: | ------------------------------------: | ----------------------------------------------------------------------------------------------------------------------------- |
| QuickSort          |                             O(n log n) |                     O(n^2) | O(n log n) (randomized) | O(log n) average stack (recursive) or O(1) iterative swaps |             No (unless modified) |           Yes (in-place partitioning) | Very fast in practice; sensitive to pivot choice; 3-way partitioning helps with duplicates.                                   |
| MergeSort          |                             O(n log n) |                 O(n log n) |              O(n log n) |                                           O(n) (aux array) |                              Yes | No (standard merge needs extra space) | Stable, predictable; good for linked lists and stable sorting needs.                                                          |
| HeapSort           |                             O(n log n) |                 O(n log n) |              O(n log n) |                                                       O(1) |                               No |                                   Yes | In-place and worst-case O(n log n); typically slower than QuickSort due to cache behavior.                                    |
| JS built-in sort   | Varies (typically O(n log n) adaptive) | Varies (depends on engine) |                  Varies |                     Varies (engines use hybrid algorithms) | Usually stable in modern engines |  Depends (usually returns same array) | Engines (V8, SpiderMonkey, JavaScriptCore) use adaptive, hybrid stable sorts (TimSort or similar). Use for most applications. |

## Detailed notes

### QuickSort

- How it works: pick a pivot, partition array into < pivot, == pivot, > pivot, then sort partitions recursively (or iteratively).
- Strengths: typically very fast (low constant factors), works in-place, can be optimized (randomized pivot, median-of-three, 3-way partitioning, insertion sort for small partitions).
- Weaknesses: worst-case O(n^2) (mitigated by randomized/median pivots); not stable by default.
- When to use: performance-critical, in-place sorting when stability is not required.

### MergeSort

- How it works: divide array into halves, recursively sort halves, then merge results.
- Strengths: stable, guaranteed O(n log n) time, well-suited for external sorting/linked lists (merging lists is O(1) extra).
- Weaknesses: needs O(n) extra memory for arrays (though bottom-up or in-place variants exist but are complex and slower).
- When to use: when stability is required, predictable worst-case performance, or when sorting linked lists.

### HeapSort

- How it works: build a heap (max-heap), repeatedly extract max and restore heap.
- Strengths: in-place with guaranteed O(n log n) worst-case time, low extra memory.
- Weaknesses: larger constant factors, less cache-friendly, not stable.
- When to use: memory-constrained situations requiring worst-case O(n log n) and no extra array.

### JavaScript built-in Array.prototype.sort

- Implementation: modern JS engines use adaptive hybrid stable sorts (TimSort or engine-specific hybrids). Implementations are tuned for typical JS workloads and heterogeneous arrays.
- Strengths: convenient, usually stable (modern engines), highly optimized in V8/SpiderMonkey/WebKit for real-world data patterns.
- Weaknesses: behavior can depend on engine version; default comparator coerces elements to strings if you don't provide a numeric comparator (remember to pass a comparator for numeric sorts).
- When to use: default choice for application-level sorting unless you need a custom algorithm for special constraints.

## Practical considerations & recommendations

- For most application code in JavaScript, use Array.prototype.sort with a proper comparator:
  - Example numeric comparator: (a, b) => a - b
  - Engines provide highly-optimized, adaptive, stable sorts.
- Choose QuickSort (or optimized variants) when:
  - You implement a library where in-place sorting with minimal extra memory and top performance per element is required.
  - You can use randomized/median-of-three pivots and small-range insertion sort to avoid worst-case behavior.
- Choose MergeSort when:
  - Stability is required and memory overhead is acceptable.
  - You sort linked lists or need guaranteed worst-case runtime.
- Choose HeapSort when:
  - You require in-place sorting and strict worst-case time bounds, and stability is not required.
- Hybrid approaches:
  - Production engine sorts often combine techniques (detect runs, use insertion sort for small ranges, use merge or adaptive strategies). Using an engine's built-in sort leverages these optimizations.

## Implementation tips

- Always provide a comparator to Array.prototype.sort if default semantics (string lexicographic) are undesirable.
- For large arrays with many duplicates, prefer 3-way partitioning in QuickSort to reduce comparisons.
- For small subarrays (e.g., length <= 16), insertion sort usually outperforms recursive sorts; hybridize for best constants.
- If you need a stable sort but prefer lower memory, consider stable in-place algorithms carefully; they are more complex and often slower.

## Final note

Algorithm choice depends on constraints: stability, memory budget, worst-case performance guarantees, and typical data distribution. For general JS use, the built-in sort is recommended; for library or systems code with strict constraints, choose or implement the algorithm that best matches those constraints.
