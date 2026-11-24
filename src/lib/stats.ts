// @ts-ignore
import jStat from 'jstat';
// @ts-ignore
import * as math from 'mathjs';

export const PRECISION = 4;
export const DEC_PREC = 1e-6;

export function round(val: number, precision = PRECISION): number {
  if (isNaN(val) || !isFinite(val)) return val;
  const factor = Math.pow(10, precision);
  return Math.round(val * factor) / factor;
}

export function factorial(n: number): number {
  if (n < 0) return NaN;
  if (n === 0 || n === 1) return 1;
  let res = 1;
  for (let i = 2; i <= Math.min(n, 170); i++) {
    res *= i;
  }
  return res;
}

export function combinations(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  if (r === 0 || r === n) return 1;
  if (r > n / 2) r = n - r;
  let num = 1;
  let den = 1;
  for (let i = 1; i <= r; i++) {
    num *= (n - (i - 1));
    den *= i;
  }
  return Math.round(num / den);
}

export function permutations(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  let res = 1;
  for (let i = 0; i < r; i++) {
    res *= (n - i);
  }
  return res;
}

// Evaluate mathematical expression with custom functions support
export function evalstr(expression: string): number {
  if (!expression || typeof expression !== 'string') return NaN;
  let expr = expression.trim();
  if (expr === '') return NaN;

  // Handle factorials e.g. 5! -> factorial(5)
  expr = expr.replace(/(\d+)!/g, 'factorial($1)');

  try {
    const scope = {
      combinations,
      permutations,
      nCr: combinations,
      nPr: permutations,
      factorial,
      sqrt: Math.sqrt,
      sqr: (x: number) => x * x,
      abs: Math.abs,
      min: Math.min,
      max: Math.max,
      E99: 1e99,
    };
    const res = math.evaluate(expr, scope);
    if (typeof res === 'number') return res;
    if (typeof res === 'object' && res !== null && 'value' in res) return Number(res.value);
    return Number(res);
  } catch (err) {
    try {
      // Fallback simple sanitized eval
      const clean = expr.replace(/[^0-9+\-*/().eE^ ]/g, '');
      const val = Function(`"use strict"; return (${clean.replace(/\^/g, '**')})`)();
      return Number(val);
    } catch {
      return NaN;
    }
  }
}

// Percentile calculation
function percentile(sortedArr: number[], p: number): number {
  if (sortedArr.length === 0) return NaN;
  if (sortedArr.length === 1) return sortedArr[0];
  const index = p * (sortedArr.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  if (lower === upper) return sortedArr[lower];
  return sortedArr[lower] * (1 - weight) + sortedArr[upper] * weight;
}

// Statistical functions
export const stats = {
  sum: (arr: number[]): number => arr.reduce((acc, v) => acc + v, 0),
  sumofsqr: (arr: number[]): number => arr.reduce((acc, v) => acc + v * v, 0),
  mean: (arr: number[]): number => (arr.length ? stats.sum(arr) / arr.length : NaN),
  min: (arr: number[]): number => (arr.length ? Math.min(...arr) : NaN),
  max: (arr: number[]): number => (arr.length ? Math.max(...arr) : NaN),

  stdev: (arr: number[]): number => {
    if (arr.length < 2) return 0;
    const m = stats.mean(arr);
    const variance = arr.reduce((acc, v) => acc + Math.pow(v - m, 2), 0) / (arr.length - 1);
    return Math.sqrt(variance);
  },

  stdevp: (arr: number[]): number => {
    if (arr.length === 0) return 0;
    const m = stats.mean(arr);
    const variance = arr.reduce((acc, v) => acc + Math.pow(v - m, 2), 0) / arr.length;
    return Math.sqrt(variance);
  },

  median: (arr: number[]): number => {
    if (arr.length === 0) return NaN;
    const sorted = [...arr].sort((a, b) => a - b);
    return percentile(sorted, 0.5);
  },

  q1: (arr: number[]): number => {
    if (arr.length === 0) return NaN;
    const sorted = [...arr].sort((a, b) => a - b);
    return percentile(sorted, 0.25);
  },

  q3: (arr: number[]): number => {
    if (arr.length === 0) return NaN;
    const sorted = [...arr].sort((a, b) => a - b);
    return percentile(sorted, 0.75);
  },

  // Weighted Statistics
  wn: (x: number[], f: number[]): number => {
    const len = Math.min(x.length, f.length);
    let total = 0;
    for (let i = 0; i < len; i++) {
      if (!isNaN(x[i]) && !isNaN(f[i])) total += f[i];
    }
    return total;
  },

  wsum: (x: number[], f: number[]): number => {
    const len = Math.min(x.length, f.length);
    let sum = 0;
    for (let i = 0; i < len; i++) {
      if (!isNaN(x[i]) && !isNaN(f[i])) sum += x[i] * f[i];
    }
    return sum;
  },

  wsumofsqr: (x: number[], f: number[]): number => {
    const len = Math.min(x.length, f.length);
    let sum = 0;
    for (let i = 0; i < len; i++) {
      if (!isNaN(x[i]) && !isNaN(f[i])) sum += x[i] * x[i] * f[i];
    }
    return sum;
  },

  wmean: (x: number[], f: number[]): number => {
    const totalF = stats.wn(x, f);
    if (totalF === 0) return NaN;
    return stats.wsum(x, f) / totalF;
  },

  wstdev: (x: number[], f: number[]): number => {
    const totalF = stats.wn(x, f);
    if (totalF <= 1) return 0;
    const mean = stats.wmean(x, f);
    const len = Math.min(x.length, f.length);
    let sumDiffSq = 0;
    for (let i = 0; i < len; i++) {
      if (!isNaN(x[i]) && !isNaN(f[i])) {
        sumDiffSq += f[i] * Math.pow(x[i] - mean, 2);
      }
    }
    return Math.sqrt(sumDiffSq / (totalF - 1));
  },

  wstdevp: (x: number[], f: number[]): number => {
    const totalF = stats.wn(x, f);
    if (totalF === 0) return 0;
    const mean = stats.wmean(x, f);
    const len = Math.min(x.length, f.length);
    let sumDiffSq = 0;
    for (let i = 0; i < len; i++) {
      if (!isNaN(x[i]) && !isNaN(f[i])) {
        sumDiffSq += f[i] * Math.pow(x[i] - mean, 2);
      }
    }
    return Math.sqrt(sumDiffSq / totalF);
  },

  wmin: (x: number[], f: number[]): number => {
    const len = Math.min(x.length, f.length);
    let minVal = Infinity;
    for (let i = 0; i < len; i++) {
      if (!isNaN(x[i]) && f[i] > 0) {
        if (x[i] < minVal) minVal = x[i];
      }
    }
    return minVal === Infinity ? NaN : minVal;
  },

  wmax: (x: number[], f: number[]): number => {
    const len = Math.min(x.length, f.length);
    let maxVal = -Infinity;
    for (let i = 0; i < len; i++) {
      if (!isNaN(x[i]) && f[i] > 0) {
        if (x[i] > maxVal) maxVal = x[i];
      }
    }
    return maxVal === -Infinity ? NaN : maxVal;
  },

  wmedian: (x: number[], f: number[]): number => {
    return stats.wpercentile(x, f, 0.5);
  },

  wq1: (x: number[], f: number[]): number => {
    return stats.wpercentile(x, f, 0.25);
  },

  wq3: (x: number[], f: number[]): number => {
    return stats.wpercentile(x, f, 0.75);
  },

  wpercentile: (x: number[], f: number[], p: number): number => {
    const totalF = stats.wn(x, f);
    if (totalF === 0) return NaN;
    const pairs: { x: number; f: number }[] = [];
    const len = Math.min(x.length, f.length);
    for (let i = 0; i < len; i++) {
      if (!isNaN(x[i]) && f[i] > 0) {
        pairs.push({ x: x[i], f: f[i] });
      }
    }
    if (pairs.length === 0) return NaN;
    pairs.sort((a, b) => a.x - b.x);

    const target = p * totalF;
    let cum = 0;
    for (let i = 0; i < pairs.length; i++) {
      cum += pairs[i].f;
      if (cum >= target) {
        return pairs[i].x;
      }
    }
    return pairs[pairs.length - 1].x;
  },

  correlation: (x: number[], y: number[]): number => {
    const n = Math.min(x.length, y.length);
    if (n < 2) return NaN;
    const meanX = stats.mean(x.slice(0, n));
    const meanY = stats.mean(y.slice(0, n));
    let num = 0;
    let denX = 0;
    let denY = 0;
    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }
    if (denX === 0 || denY === 0) return 0;
    return num / Math.sqrt(denX * denY);
  },

  linreg: (x: number[], y: number[]): [number, number] => {
    const n = Math.min(x.length, y.length);
    if (n < 2) return [NaN, NaN];
    const meanX = stats.mean(x.slice(0, n));
    const meanY = stats.mean(y.slice(0, n));
    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      num += dx * (y[i] - meanY);
      den += dx * dx;
    }
    if (den === 0) return [NaN, NaN];
    const m = num / den;
    const b = meanY - m * meanX;
    return [m, b];
  },
};

export { jStat };
