import { reactive } from 'vue';
import { setNextLatentChord, handleInterstationNoise } from './audioPlayback';
import * as LatentMath from './latentStrategies.js';

export const Broadcaster = reactive({
  // --- STATE ---
  tunerValue: 0,
  selectedStrategy: 'angular', // options: 'knn', 'linear', 'angular'
  isBetweenStations: false,
  
  // --- DATA ---
  chordDict: [],
  phrases: [],
  history: [],
  MAX_HISTORY: 15,
  
  // --- SEQUENCER ---
  currentPhrase: null,
  stepIndex: -1,
  currentStepData: null,

  /**
   * Initializes the Broadcaster with the required data.
   */
  init(chords, phrases) {
    // Ensure chords have z for LatentMath and x/y for UI visualization
    this.chordDict = chords.map(c => ({
      ...c,
      x: c.z[0], 
      y: c.z[1]
    }));

    // Inject the dictionary into the math utility
    LatentMath.setChordDict(this.chordDict);
    
    this.phrases = phrases;
    this.pickRandomStation();
  },

  /**
   * Resets the tuner and picks a new Bach chorale.
   */
  pickRandomStation() {
    this.isBetweenStations = true;
    setNextLatentChord(null); 
    handleInterstationNoise(this.tunerValue, true);

    // Artificial delay to simulate "searching" through radio static
    setTimeout(() => {
      const pool = this.phrases.filter(p => !this.history.includes(p.id));
      const selection = pool.length > 0 ? pool : this.phrases;
      
      this.currentPhrase = selection[Math.floor(Math.random() * selection.length)];
      
      // Update history
      this.history.push(this.currentPhrase.id);
      if (this.history.length > this.MAX_HISTORY) this.history.shift();

      this.stepIndex = -1;
      this.isBetweenStations = false;
      handleInterstationNoise(this.tunerValue, false);
      
      console.log(`Now playing: ${this.currentPhrase.name} via ${this.selectedStrategy} logic`);
    }, 2000);
  },

  /**
   * Called by the recursive loop in audioPlayback.js.
   * Advances one slice and calculates the substitution.
   */
  nextStep() {
    if (this.isBetweenStations || !this.currentPhrase) return null;
    
    this.stepIndex++;

    // If we reach the end of the chorale, start searching again
    if (this.stepIndex >= this.currentPhrase.sequence.length) {
      this.pickRandomStation();
      return null;
    }

    this.currentStepData = this.currentPhrase.sequence[this.stepIndex];
    this.generateDriftChord();
    
    return this.currentStepData;
  },

  /**
   * Real-time update from the UI Tuner dial.
   */
  updateTuning(val) {
    this.tunerValue = val;
    handleInterstationNoise(val, this.isBetweenStations);
    
    // If the user turns the knob mid-note, recalculate the drift immediately
    if (!this.isBetweenStations && this.currentStepData) {
      this.generateDriftChord();
    }
  },

  /**
   * THE DRIFT ENGINE
   * Implements the logic from latentStrategies.js based on current tunerValue.
   */
  generateDriftChord() {
    if (!this.currentStepData || !this.currentPhrase) return;

    const sequence = this.currentPhrase.sequence;
    const i = this.stepIndex;

    // A: Previous, B: Target (Current), C: Next
    const B = LatentMath.getChordById(this.currentStepData.id);
    const A = i > 0 ? LatentMath.getChordById(sequence[i - 1].id) : null;
    const C = i < sequence.length - 1 ? LatentMath.getChordById(sequence[i + 1].id) : null;

    if (!B) return;

    // If tuned perfectly (tuner < 0.05), play pure Bach
    if (this.tunerValue < 0.05) {
      setNextLatentChord(B);
      return;
    }

    // Map tunerValue (0 to 1) to k (number of neighbors to consider)
    const k = Math.max(1, Math.floor(this.tunerValue * 40));

    let finalChordId = B.id;

    // --- APPLY STRATEGIES ---
    // We use the math functions you provided to determine the substituted ID
    try {
      if (this.selectedStrategy === 'knn') {
        // Find closest neighbor within k candidates
        const neighbors = LatentMath.knn(B.z, this.chordDict, k);
        // We pick a random neighbor among the k-closest for "shimmer"
        const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
        finalChordId = chosen ? chosen.id : B.id;

      } else if (this.selectedStrategy === 'linear' && A && C) {
        // Midpoint bridge between A and C
        const result = LatentMath.linearInterpolation(A, C);
        finalChordId = result.id;

      } else if (this.selectedStrategy === 'angular' && A) {
        // Aligns voice leading vector (Directional drift)
        const result = LatentMath.knnAngularAlignment(A, B, k);
        finalChordId = result.id;
      }
    } catch (e) {
      console.warn("Drift Calculation Error:", e);
      finalChordId = B.id;
    }

    const driftedChord = LatentMath.getChordById(finalChordId);

    console.log(driftedChord);
    setNextLatentChord(driftedChord || B);
  }
});