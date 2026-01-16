import { reactive } from 'vue';
import { setNextLatentChord } from './audioPlayback';

export const Broadcaster = reactive({
  tunerValue: 0,
  isScanning: false,
  chordDict: [],
  currentChord: null,
  lastChord: null,
  
  // To keep track of the manifold bounds
  bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 },

  /**
   * Initializes the engine with the raw JSON data
   */
  init(chords) {
    if (!chords || chords.length === 0) return;

    // 1. Map the z2D array to x/y properties for easier math
    this.chordDict = chords.map(c => ({
      ...c,
      x: c.z2D[0],
      y: c.z2D[1]
    }));

    // 2. Calculate the boundaries of the latent space
    const xs = this.chordDict.map(c => c.x);
    const ys = this.chordDict.map(c => c.y);
    this.bounds.minX = Math.min(...xs);
    this.bounds.maxX = Math.max(...xs);
    this.bounds.minY = Math.min(...ys);
    this.bounds.maxY = Math.max(...ys);

    // 3. Set initial state
    this.currentChord = this.chordDict[0];
    this.lastChord = this.chordDict[0];
  },

  /**
   * Called by the Tuner.vue watch(tunerValue)
   */
  updateTuning(val) {
    // Detect rapid movement for the "Scramble" effect
    const delta = Math.abs(val - this.tunerValue);
    this.isScanning = delta > 0.06;
    this.tunerValue = val;

    if (!this.chordDict.length) return;

    // --- NAVIGATION STRATEGY ---
    
    // Radius of "Drift": How far from the last chord can we jump?
    // val = 0 (Bach) -> Radius is tiny (stuck on the original)
    // val = 1 (Max Drift) -> Radius is large (searching widely)
    const latentRange = this.bounds.maxX - this.bounds.minX;
    const searchRadius = (val * 0.15) * latentRange; // Search up to 15% of the space

    // 1. k-Nearest Neighbors (k-NN)
    // Find chords within the drift radius
    let neighbors = this.chordDict
      .filter(chord => {
        const d = Math.hypot(chord.x - this.lastChord.x, chord.y - this.lastChord.y);
        // Ensure we don't just stay on the same chord (d > 0)
        return d > 0 && d <= searchRadius + 0.1; 
      })
      .sort((a, b) => {
        const distA = Math.hypot(a.x - this.lastChord.x, a.y - this.lastChord.y);
        const distB = Math.hypot(b.x - this.lastChord.x, b.y - this.lastChord.y);
        return distA - distB;
      })
      .slice(0, 10);

    // 2. If no neighbors found (radius too small), just grab the closest one overall
    if (neighbors.length === 0) {
      neighbors = [this.chordDict.sort((a, b) => {
        return Math.hypot(a.x - this.lastChord.x, a.y - this.lastChord.y) - 
               Math.hypot(b.x - this.lastChord.x, b.y - this.lastChord.y);
      })[1]]; // [1] to avoid picking itself
    }

    // 3. Angular Alignment (Momentum)
    // We favor chords that maintain the "trajectory" as the dial turns
    const bestMatch = neighbors.reduce((prev, curr) => {
      // Current trajectory vector
      const currVec = { x: curr.x - this.lastChord.x, y: curr.y - this.lastChord.y };
      // Target vector (arbitrary "forward" motion in latent space)
      const targetVec = { x: 1, y: 1 }; 
      
      const similarity = this.calculateCosineSimilarity(targetVec, currVec);
      
      // Score = Blend of Distance and Direction
      const weight = val; // Higher drift = more momentum
      const score = (1 - weight) * (Math.hypot(currVec.x, currVec.y)) + (weight * (1 - similarity));

      return score < prev.score ? { chord: curr, score } : prev;
    }, { chord: neighbors[0], score: Infinity });

    // Update state
    this.lastChord = this.currentChord;
    this.currentChord = bestMatch.chord;
    
    // Send to Audio Buffer
    setNextLatentChord(this.currentChord);
  },

  calculateCosineSimilarity(v1, v2) {
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x**2 + v1.y**2);
    const mag2 = Math.sqrt(v2.x**2 + v2.y**2);
    if (mag1 === 0 || mag2 === 0) return 0;
    return dot / (mag1 * mag2);
  }
});