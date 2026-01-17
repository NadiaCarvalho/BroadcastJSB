/**
 * Calculates the standard Euclidean distance between two vectors.
 * Optimized for 2D/3D latent spaces.
 */
export function euclidean(a, b) {
  if (!a || !b) return Infinity;
  // Faster than a loop for fixed-dimension vectors (z0, z1)
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
}

/**
* Vector Subtraction (B - A)
*/
export function subtract(b, a) {
  return [b[0] - a[0], b[1] - a[1]];
}

/**
* Vector Addition (A + B)
*/
export function add(a, b) {
  return [a[0] + b[0], a[1] + b[1]];
}

/**
* Scalar Scaling
*/
export function scale(a, factor) {
  return [a[0] * factor, a[1] * factor];
}

/**
* Dot Product
*/
export function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1];
}

/**
* Magnitude
*/
export function mag(a) {
  return Math.sqrt(a[0] * a[0] + a[1] * a[1]);
}

/**
* Angle Between two vectors (in radians)
*/
export function angleBetween(v1, v2) {
  const d = dot(v1, v2);
  const m1 = mag(v1);
  const m2 = mag(v2);
  if (m1 === 0 || m2 === 0) return 0;
  
  // Clamp for precision errors
  let ratio = d / (m1 * m2);
  if (ratio > 1) ratio = 1;
  if (ratio < -1) ratio = -1;
  
  return Math.acos(ratio);
}