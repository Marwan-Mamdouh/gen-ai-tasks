// Micro-benchmark comparing quickSortEnhanced (task3.js) vs built-in Array.prototype.sort
// Run: node task5_benchmark.js
// Optionally run with: node --expose-gc task5_benchmark.js  (allows explicit GC between runs)

const { performance } = require("perf_hooks");
let quickSort;
try {
  quickSort = require("./task3.js"); // expects module.exports = quickSortEnhanced
} catch (e) {
  console.error(
    "Could not require ./task3.js. Ensure task3.js exists and exports the function."
  );
  process.exit(1);
}

if (typeof quickSort !== "function") {
  console.error("Required module does not export a function.");
  process.exit(1);
}

function randInt(max) {
  return Math.floor(Math.random() * max);
}

function genRandom(n, range = 1e6) {
  const a = new Array(n);
  for (let i = 0; i < n; i++) a[i] = randInt(range) - (range >> 1);
  return a;
}
function genSorted(n) {
  const a = genRandom(n);
  a.sort((x, y) => x - y);
  return a;
}
function genReverse(n) {
  return genSorted(n).reverse();
}
function genManyDuplicates(n, unique = 5) {
  const a = new Array(n);
  for (let i = 0; i < n; i++) a[i] = i % unique;
  // shuffle a bit so it's not fully ordered
  for (let i = 0; i < n; i++) {
    const j = Math.floor(Math.random() * n);
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

function cloneArray(a) {
  return a.slice();
}

function stats(times) {
  times.sort((a, b) => a - b);
  const sum = times.reduce((s, v) => s + v, 0);
  const mean = sum / times.length;
  const median =
    times.length % 2 === 1
      ? times[(times.length - 1) / 2]
      : (times[times.length / 2 - 1] + times[times.length / 2]) / 2;
  const min = times[0];
  const max = times[times.length - 1];
  return { mean, median, min, max, runs: times.length };
}

function runOnce(fn) {
  const t0 = performance.now();
  fn();
  const t1 = performance.now();
  return t1 - t0;
}

function ensureCorrectness(sortFn, arr, comparator) {
  const aCopy = cloneArray(arr);
  const out = sortFn(aCopy, comparator ? { comparator } : undefined);
  // quickSortEnhanced may return new array or in-place; ensure we get array:
  const candidate = Array.isArray(out) ? out : aCopy;
  const expected = cloneArray(arr).sort((x, y) => x - y);
  // compare
  if (candidate.length !== expected.length) return false;
  for (let i = 0; i < expected.length; i++) {
    if (candidate[i] !== expected[i]) return false;
  }
  return true;
}

function benchScenario(
  name,
  genFn,
  sizes = [1000, 5000, 20000],
  iterations = 5
) {
  console.log(`\nScenario: ${name}`);
  for (const n of sizes) {
    const base = genFn(n);
    // quick correctness sanity check
    if (!ensureCorrectness(quickSort, base)) {
      console.error(
        "quickSortEnhanced failed correctness check on sample input. Aborting."
      );
      process.exit(1);
    }
    // prepare arrays for runs
    const qsTimes = [];
    const builtinTimes = [];

    for (let k = 0; k < iterations; k++) {
      // optional GC between runs
      if (typeof global.gc === "function") global.gc();

      const a1 = cloneArray(base);
      const tQ = runOnce(() => {
        // quickSortEnhanced accepts (input, options)
        const out = quickSort(a1, { inPlace: false, pivot: "random" });
        // guard to ensure result computed (avoid optimizer elision)
        if (!Array.isArray(out))
          throw new Error("quickSort did not return array");
      });
      qsTimes.push(tQ);

      if (typeof global.gc === "function") global.gc();

      const a2 = cloneArray(base);
      const tB = runOnce(() => {
        // built-in: pass numeric comparator
        a2.sort((x, y) => x - y);
      });
      builtinTimes.push(tB);
    }

    const sQ = stats(qsTimes);
    const sB = stats(builtinTimes);

    console.log(
      `n=${n.toLocaleString()}: quickSort -> mean ${sQ.mean.toFixed(
        3
      )} ms (med ${sQ.median.toFixed(3)}, min ${sQ.min.toFixed(
        3
      )}) | built-in -> mean ${sB.mean.toFixed(3)} ms (med ${sB.median.toFixed(
        3
      )}, min ${sB.min.toFixed(3)}) | ratio quick/builtin ${(
        sQ.median / sB.median
      ).toFixed(3)}`
    );
  }
}

function main() {
  console.log("Node.js QuickSort vs Built-in sort benchmark");
  console.log("QuickSort implementation:", quickSort.name || "(anonymous)");
  console.log(
    "Note: run with `node --expose-gc task5_benchmark.js` to enable GC between runs\n"
  );

  const sizesSmall = [500, 2000, 8000];
  const sizesMedium = [1000, 5000, 20000];
  const sizesLarge = [20000, 50000]; // watch memory/time

  // Scenarios
  benchScenario("Random integers", genRandom, sizesMedium, 5);
  benchScenario("Already sorted", genSorted, sizesMedium, 5);
  benchScenario("Reverse sorted", genReverse, sizesMedium, 5);
  benchScenario(
    "Many duplicates",
    (n) => genManyDuplicates(n, 5),
    sizesMedium,
    5
  );

  // A larger random test (single run each)
  benchScenario("Large random (single run)", genRandom, sizesLarge, 1);

  console.log("\nBenchmark complete.");
  console.log(
    "Interpretation: compare median times; ratio <1 means quickSort faster than built-in median; >1 means slower."
  );
  console.log(
    "Built-in sorts in modern engines are highly optimized (TimSort/hybrids) and may outperform naive quicksort in many cases."
  );
}

main();
