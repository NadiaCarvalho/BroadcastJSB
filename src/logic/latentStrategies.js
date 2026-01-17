import { knn, add, scale, subtract, angleBetween, euclidean } from './distance.js';

// Global variable to store the chord dictionary loaded from the JSON
let globalChordDict = [];

/**
 * Sets the global chord dictionary for use across all strategy functions.
 * @param {Array<Object>} dict - The full array of chord objects.
 */
export function setChordDict(dict) {
  globalChordDict = dict;
}

/**
 * Gets a chord object from the global dictionary by ID.
 * @param {string} id - The chord ID.
 */
export function getChordById(id) {
  if (globalChordDict)
    return globalChordDict.find(chord => chord.id === id);
  return null;
}

// --- STRATEGY 1: K-NEAREST NEIGHBORS (Paper §2.2) ---

/**
 * Implements the k-Nearest Neighbors substitution strategy.
 * Broadcaster uses this to pick a replacement for B from k neighbors.
 */
export function knnSubstitution(B, k) {
  if (!B || !B.z) return [];
  
  // knn() from distance.js returns an array of chord objects
  const neighbors = knn(B.z, globalChordDict, k);
  
  // If no neighbors found, return B in an array so .length doesn't fail
  if (!neighbors || neighbors.length === 0) {
    return [B];
  }
  
  return neighbors; 
}

// --- STRATEGY 2: LINEAR INTERPOLATION (Paper §2.1) ---

/**
 * Samples a chord nearest to the midpoint between A and C.
 */
export function linearInterpolation(A, C) {
  if (!A || !C || !A.z || !C.z) return { id: C ? C.id : null };

  // Midpoint Formula: p = 0.5 * A + 0.5 * C
  const interpolatedPoint = add(scale(A.z, 0.5), scale(C.z, 0.5));

  // Find the chord nearest to the interpolated point
  const distances = globalChordDict.map(chord => ({
    ...chord,
    distance: euclidean(interpolatedPoint, chord.z),
  }));

  distances.sort((a, b) => a.distance - b.distance);

  const nearestChord = distances[0];

  return {
    id: nearestChord ? nearestChord.id : C.id,
    geometricPoint: interpolatedPoint,
  };
}


// --- STRATEGY 3: K-NN WITH ANGULAR ALIGNMENT (Paper §2.3) ---

/**
 * Finds the candidate neighbor of B that has the least angular deviation relative to AB.
 */
export function knnAngularAlignment(A, B, k) {
  if (!A || !B || !A.z || !B.z) return { id: B ? B.id : null };

  // 1. Get the k nearest neighbors of B
  const neighbors = knn(B.z, globalChordDict, k);

  // 2. Determine the original vector AB
  const vectorAB = subtract(B.z, A.z);

  let bestCandidate = null;
  let bestAngle = Infinity;

  // 3. Assess the angular disparity
  neighbors.forEach(candidate => {
    const vectorAC = subtract(candidate.z, A.z);
    const angle = angleBetween(vectorAB, vectorAC);

    if (angle < bestAngle) {
      bestAngle = angle;
      bestCandidate = candidate;
    }
  });

  return {
    id: bestCandidate ? bestCandidate.id : B.id,
    kNeighbors: neighbors
  };
}

/**
 * Keeping your phrase-based orchestration function for bulk processing if needed.
 */
export function substitutePhrase(originalPhraseIds, targetIndices, strategy, params) {
  const generatedPhraseIds = [...originalPhraseIds];
  const fullPhrase = originalPhraseIds.map(id => getChordById(id)).filter(c => c);
  const i = targetIndices[0];
  const k = params.k || 5;

  if (targetIndices.length === 1 && i > 0 && i < originalPhraseIds.length - 1) {
    const A = fullPhrase[i - 1];
    const B = fullPhrase[i];
    const C = fullPhrase[i + 1];

    if (A && B && C) {
      if (strategy === 'knn') {
        const neighbors = knnSubstitution(B, k);
        generatedPhraseIds[i] = neighbors[0].id;
      } else if (strategy === 'linear') {
        generatedPhraseIds[i] = linearInterpolation(A, C).id;
      } else if (strategy === 'angular') {
        generatedPhraseIds[i] = knnAngularAlignment(A, B, k).id;
      }
    }
  }
  return { generatedPhraseIds };
}