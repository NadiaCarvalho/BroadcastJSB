import { reactive } from 'vue';
import { setNextLatentChord, handleInterstationNoise } from './audioPlayback';
import * as LatentMath from './latentStrategies.js';

export const Broadcaster = reactive({
  // --- STATE ---
  tunerValue: 0,
  selectedStrategy: 'knn', // options: 'knn', 'linear', 'angular'
  isBetweenStations: false,
  isReady: false,
  
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
   * Initializes the Broadcaster with the local JSON data.
   * Since imports are synchronous in Webpack, this runs immediately.
   */
  init(chords, phrases) {
    if (!chords || chords.length === 0 || !phrases || phrases.length === 0) {
      console.warn("Broadcaster: Initialization data missing or empty.");
      return;
    }

    // Map chords to include x/y for potential UI visualization
    this.chordDict = chords.map(c => ({
      ...c,
      x: c.z[0], 
      y: c.z[1]
    }));

    // Inject the dictionary into the math utility for calculations
    LatentMath.setChordDict(this.chordDict);
    this.phrases = phrases;

    // Set readiness and find the first chorale
    this.isReady = true;
    this.pickRandomStation();
    console.log("Broadcaster Ready: Data successfully loaded from Webpack bundle.");
  },

  /**
   * Simulates finding a new radio station.
   * Sets the 'isBetweenStations' flag to trigger static/noise.
   */
  pickRandomStation() {
    if (!this.isReady) return;

    this.isBetweenStations = true;
    setNextLatentChord(null); // Clear the current chord goal
    handleInterstationNoise(this.tunerValue, true);

    // Simulated "Scanning" delay (2 seconds of static)
    setTimeout(() => {
      // Filter out recently played phrases to keep the installation fresh
      const pool = this.phrases.filter(p => !this.history.includes(p.id));
      const selection = pool.length > 0 ? pool : this.phrases;
      
      this.currentPhrase = selection[Math.floor(Math.random() * selection.length)];
      
      // Update history tracking
      this.history.push(this.currentPhrase.id);
      if (this.history.length > this.MAX_HISTORY) this.history.shift();

      this.stepIndex = -1;
      this.isBetweenStations = false;
      
      // Update audio engine: switch noise from 'scan' mode to 'drift' mode
      handleInterstationNoise(this.tunerValue, false);
      
      console.log(`Station Locked: ${this.currentPhrase.name} | Strategy: ${this.selectedStrategy}`);
    }, 2000);
  },

  /**
   * Triggered by playNextSlice() in audioPlayback.js.
   * Increments the index and calculates the next mathematical goal.
   */
  nextStep() {
    if (!this.isReady || this.isBetweenStations || !this.currentPhrase) return null;
    
    this.stepIndex++;

    // If we've reached the end of the Bach chorale, find a new one
    if (this.stepIndex >= this.currentPhrase.sequence.length) {
      this.pickRandomStation();
      return null;
    }

    this.currentStepData = this.currentPhrase.sequence[this.stepIndex];
    
    // Calculate the substitution immediately based on current tunerValue
    this.generateDriftChord();
    
    return this.currentStepData;
  },

  /**
   * External update from the UI Dial.
   * Updates both the noise floor and the latent substitution.
   */
  updateTuning(val) {
    this.tunerValue = val;
    handleInterstationNoise(val, this.isBetweenStations);
    
    // Force a recalculation if the user turns the knob while a note is sustaining
    if (this.isReady && !this.isBetweenStations && this.currentStepData) {
      this.generateDriftChord();
    }
  },

  /**
   * THE LATENT ENGINE
   * Uses LatentMath to find a replacement chord based on 'tunerValue'.
   */
  generateDriftChord() {
    if (!this.isReady || !this.currentStepData || !this.currentPhrase) return;

    const sequence = this.currentPhrase.sequence;
    const i = this.stepIndex;

    // Context: A (Previous), B (Target/Original), C (Next)
    const B = LatentMath.getChordById(this.currentStepData.id);
    const A = i > 0 ? LatentMath.getChordById(sequence[i - 1].id) : null;
    const C = i < sequence.length - 1 ? LatentMath.getChordById(sequence[i + 1].id) : null;

    if (!B) return;

    // 1. Direct Signal: If tuned perfectly (tuner < 0.05), play the exact Bach chord
    if (this.tunerValue < 0.05) {
      setNextLatentChord(B);
      return;
    }

    // 2. Drifted Signal: Calculate substitution using the current strategy
    // Map tuner (0 to 1) to k neighbors (1 to 40)
    const k = Math.max(1, Math.floor(this.tunerValue * 40));
    let finalChordId = B.id;

    try {
      if (this.selectedStrategy === 'knn') {
        const neighbors = LatentMath.knnSubstitution(B, k);
        // Randomly pick from k-neighbors to create a "shimmering" effect
        if (Array.isArray(neighbors) && neighbors.length > 0) {
          const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
          finalChordId = chosen ? chosen.id : B.id;
          console.log(k, B.id, chosen.id, finalChordId);
        }

      } else if (this.selectedStrategy === 'linear' && A && C) {
        // Interpolate between A and C, skipping B
        const result = LatentMath.linearInterpolation(A, C);
        finalChordId = result.id;

      } else if (this.selectedStrategy === 'angular' && A) {
        // Follow the vector from A to B but drift towards neighbors
        const result = LatentMath.knnAngularAlignment(A, B, k);
        finalChordId = result.id;
      }
    } catch (e) {
      console.warn("Broadcaster: Substitution error, falling back to original.", e);
      finalChordId = B.id;
    }

    // Update the audio engine with the new target chord
    const driftedChord = LatentMath.getChordById(finalChordId);
    setNextLatentChord(driftedChord || B);
  }
});