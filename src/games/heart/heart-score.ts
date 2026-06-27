export type Pt = [number, number];

/** Resample a closed polyline to N points equally spaced by arc length. */
export function resampleClosed(points: Pt[], n: number): Pt[] {
  if (points.length < 2) return points.slice();
  const pts = points.slice();
  pts.push(pts[0]); // close the loop
  const seg: number[] = [0];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    seg.push(total);
  }
  if (total === 0) return Array(n).fill(pts[0]);
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const d = (i / n) * total;
    // find segment
    let k = 1;
    while (k < seg.length && seg[k] < d) k++;
    const t = (d - seg[k - 1]) / (seg[k] - seg[k - 1] || 1);
    out.push([
      pts[k - 1][0] + t * (pts[k][0] - pts[k - 1][0]),
      pts[k - 1][1] + t * (pts[k][1] - pts[k - 1][1]),
    ]);
  }
  return out;
}

/** Translate to centroid and scale so mean radius = 1. */
export function normalize(points: Pt[]): Pt[] {
  const n = points.length;
  let cx = 0,
    cy = 0;
  for (const [x, y] of points) {
    cx += x;
    cy += y;
  }
  cx /= n;
  cy /= n;
  let mr = 0;
  for (const [x, y] of points) mr += Math.hypot(x - cx, y - cy);
  mr = mr / n || 1;
  return points.map(([x, y]) => [(x - cx) / mr, (y - cy) / mr] as Pt);
}

/** Ideal heart, sampled & normalized, oriented point-down for screen coords (y grows down). */
export function idealHeart(n: number): Pt[] {
  const raw: Pt[] = [];
  const steps = 400;
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const x = 16 * Math.sin(t) ** 3;
    const y =
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t);
    raw.push([x, -y]); // flip y so the point faces down on screen
  }
  return normalize(resampleClosed(raw, n));
}

const N = 128;
const IDEAL = idealHeart(N);

/** Mean point distance after aligning index-shift and winding direction. */
function bestMeanDist(a: Pt[], b: Pt[]): number {
  let best = Infinity;
  for (const dir of [1, -1]) {
    for (let shift = 0; shift < N; shift++) {
      let sum = 0;
      for (let i = 0; i < N; i++) {
        const j = dir === 1 ? (i + shift) % N : (shift - i + N * 2) % N;
        const dx = a[i][0] - b[j][0];
        const dy = a[i][1] - b[j][1];
        sum += Math.hypot(dx, dy);
      }
      if (sum < best) best = sum;
    }
  }
  return best / N;
}

/**
 * Accuracy 0–100 of how close a freehand drawing is to a perfect heart.
 * Invariant to size, position, starting point and drawing direction.
 */
export function heartAccuracy(drawing: Pt[]): number {
  if (drawing.length < 8) return 0;
  const norm = normalize(resampleClosed(drawing, N));
  const meanDist = bestMeanDist(norm, IDEAL);
  // meanDist ~0 (perfect) .. ~0.5+ (nothing like a heart). Tuned so a neat
  // hand-drawn heart lands ~75–90, while circles/squares fall well below.
  const K = 0.5;
  const acc = 100 * (1 - meanDist / K);
  return Math.max(0, Math.min(100, Math.round(acc)));
}

/** Normalized ideal heart scaled to a drawing box, for showing a faint guide. */
export function idealPath(size: number): Pt[] {
  const half = size / 2;
  return IDEAL.map(([x, y]) => [half + x * half * 0.42, half + y * half * 0.42] as Pt);
}
