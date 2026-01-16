import { reactive } from 'vue';
import { setNextLatentChord } from './audioPlayback';

/**
 * Broadcaster Service
 * Manages the state of the "Radio" and the navigation math.
 */
export const Broadcaster = reactive({
  tunerValue: 0,
  isScanning: false,
  chordDict: [],
  currentChord: null,
  lastChord: null,

  /**
   * Initializes the engine with the chord dictionary
   */
  init(chords) {
    this.chordDict = chords;
    // Start with a standard Bach chord (e.g., the first one in the set)
    this.currentChord = chords[0];
    this.lastChord = chords[0];
  },

  /**
   * Main navigation logic called by the Tuner UI
   * @param {Number} val - The current tuner value (0.0 to 1.0)
   */
  updateTuning(val) {
    // 1. Detect "Scanning" (fast movement)
    const delta = Math.abs(val - this.tunerValue);
    this.isScanning = delta > 0.07;
    this.tunerValue = val;

    if (!this.chordDict.length) return;

    // 2. Determine the search parameters based on the Dial
    // As tunerValue increases, we allow the "Drift" to find chords further away
    const driftRadius = val * 500; // Adjust based on your PCA coordinate scale
    const kCount = Math.floor(5 + val * 15); // Look at more neighbors as we drift

    // 3. Find k-Nearest Neighbors
    // (In a production app, use 'static-kdtree' here for O(log n) speed)
    const neighbors = this.chordDict
      .map(chord => ({
        ...chord,
        distance: Math.hypot(chord.x - this.lastChord.x, chord.y - this.lastChord.y)
      }))
      .filter(chord => chord.distance > 0 && chord.distance < driftRadius + 50)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, kCount);

    if (neighbors.length === 0) return;

    // 4. Strategy: Angular Alignment (The "Momentum" Filter)
    // We want to pick a chord that continues the "direction" of the navigation
    // rather than just the closest one.
    
    // Simulate a target vector (moving "away" from the center as we tune up)
    const targetVector = { x: 1, y: 1 }; 

    const bestMatch = neighbors.reduce((prev, curr) => {
      const currVector = { 
        x: curr.x - this.lastChord.x, 
        y: curr.y - this.lastChord.y 
      };
      
      const similarity = this.calculateCosineSimilarity(targetVector, currVector);
      
      // Blend Weight: How much do we care about Direction vs Proximity?
      // This matches the "Strategy Slider" in your research.
      const momentumWeight = val; 
      const score = (1 - momentumWeight) * (curr.distance / 100) + momentumWeight * (1 - similarity);

      return (score < prev.score) ? { chord: curr, score } : prev;
    }, { chord: neighbors[0], score: Infinity });

    // 5. Update state and Audio Buffer
    this.lastChord = this.currentChord;
    this.currentChord = bestMatch.chord;
    setNextLatentChord(this.currentChord);
  },

  /**
   * Vector Math for Directional Navigation
   */
  calculateCosineSimilarity(v1, v2) {
    const dotProduct = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    if (mag1 === 0 || mag2 === 0) return 0;
    return dotProduct / (mag1 * mag2);
  }
});