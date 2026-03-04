import { kdTree } from 'kd-tree-javascript';
import { add, scale, subtract, angleBetween, euclidean } from './distance.js';

let globalChordDict = [];
let tree = null;

export function setChordDict(dict) {
  globalChordDict = dict;
  
  // This library takes the objects directly and a distance function
  const distance = (a, b) => euclidean(a.z, b.z);
  
  // Build the tree (z is the dimension key)
  tree = new kdTree(dict, distance, ["z"]);
}

export function knnSubstitution(B, k) {
  if (!B || !B.z || !tree) return [];

  // nearest() returns [[object, distance], [object, distance]...]
  const result = tree.nearest(B, k + 1);

  // Map to objects, skip the first one (itself)
  const neighbors = result
    .slice(1)
    .map(item => item[0]);

  return neighbors.length > 0 ? neighbors : [B];
}

export function linearInterpolation(A, C) {
  if (!A || !C || !tree) return { id: C?.id };

  const interpolatedPoint = add(scale(A.z, 0.5), scale(C.z, 0.5));
  
  // We need a dummy object for the search
  const dummy = { z: interpolatedPoint };
  const nearest = tree.nearest(dummy, 1);
  const nearestChord = nearest.length > 0 ? nearest[0][0] : null;

  return {
    id: nearestChord ? nearestChord.id : C.id,
    geometricPoint: interpolatedPoint,
  };
}

export function knnAngularAlignment(A, B, k) {
  if (!A || !B || !tree) return { id: B?.id };

  const result = tree.nearest(B, k + 1);
  const neighbors = result.slice(1).map(item => item[0]);
  const vectorAB = subtract(B.z, A.z); 

  let bestCandidate = null;
  let bestAngle = Infinity;

  neighbors.forEach(candidate => {
    const vectorAC = subtract(candidate.z, A.z);
    const angle = angleBetween(vectorAB, vectorAC);
    if (angle < bestAngle) {
      bestAngle = angle;
      bestCandidate = candidate;
    }
  });

  return { id: bestCandidate ? bestCandidate.id : B.id, kNeighbors: neighbors };
}

export function getChordById(id) {
  return globalChordDict.find(chord => chord.id === id) || null;
}