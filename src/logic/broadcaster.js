import { reactive } from 'vue';
import { setNextLatentChord, handleInterstationNoise } from './audioPlayback';
import * as LatentMath from './latentStrategies.js';

export const Broadcaster = reactive({
  // --- STATE ---
  tunerValue: 0,
  selectedStrategy: 'angular', // options: 'knn', 'linear', 'angular'
  isBetweenStations: false,
  isReady: false,
  lastSelectionWasOriginal: false,

  // --- DATA ---
  chordDict: [],
  phrases: [],
  history: [],
  MAX_HISTORY: 15,

  // --- DEBUG DATA ---
  debugPhrases: [],
  debugChorale: 'BWV 269 - phrase 1',
  stepHistory: [],  // ADD THIS: For individual chord/step data
  MAX_STEP_HISTORY: 0, // Keep it performant

  // --- SEQUENCER ---
  currentPhrase: null,
  stepIndex: -1,
  currentStepData: null,

  /**
   * Initializes the Broadcaster with the local JSON data.
   * Since imports are synchronous in Webpack, this runs immediately.
   */
  init(chords, phrases, debugPhrases = null) {
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

    if (debugPhrases) {
      this.debugPhrases = debugPhrases;
    }

    // Set readiness and find the first chorale
    this.isReady = true;
    
    if (this.debugChorale) {
      this.pickSpecificStation(this.debugChorale);
    } else {
      this.pickRandomStation();
    }
    
    console.log("Broadcaster Ready: Data successfully loaded from Webpack bundle.");
  },

  /**
   * Finds a specific radio station/chorale by its ID.
   * @param {string|number} stationId - The unique ID of the phrase to load.
   */
  pickSpecificStation(stationId) {
    if (!this.isReady) return;

    // 1. Trigger the "Between Stations" aesthetic (static/noise)
    this.isBetweenStations = true;
    setNextLatentChord(null);
    handleInterstationNoise(this.tunerValue, true);

    // 2. Locate the specific station in your data
    let target = this.debugPhrases.find(p => p.id === stationId);
    if (!target) target = this.phrases.find(p => p.id === stationId);

    if (!target) {
      console.error(`Station ${stationId} not found.`);
      // Optional: stop the noise if nothing is found
      this.isBetweenStations = false;
      return;
    }

    this.MAX_STEP_HISTORY = target.sequence.length;

    // 3. Simulated "Scanning" delay for immersion
    setTimeout(() => {
      this.currentPhrase = target;

      this.stepIndex = -1;
      this.isBetweenStations = false;

      // Switch noise back to 'drift' mode
      handleInterstationNoise(this.tunerValue, false);

      console.log(`Manual Lock: ${this.currentPhrase.id}: ${this.currentPhrase.name}`);
    }, 2000);
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

      console.log(`Station Locked: ${this.currentPhrase.id}: ${this.currentPhrase.name} | Strategy: ${this.selectedStrategy}`);
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
      if (this.debugChorale) {
        this.downloadSessionJSON();
        this.logStationSummary();
        this.pickSpecificStation(this.debugChorale);
      } else {
        this.pickRandomStation();
      }
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

    // 1. Direct Signal: If tuned perfectly (tuner < 0.1), play the exact Bach chord
    if (this.tunerValue < 0.1) {
      this.saveSnapshotToHistory(B, B.id);
      setNextLatentChord(B);
      return;
    }

    // 2. Drifted Signal: Calculate substitution using the current strategy
    // We use Math.pow(val, 3) to create a steep curve.
    // 0.1 tuner -> ~1 neighbor (Very stable)
    // 0.5 tuner -> ~12 neighbors (Slightly adventurous)
    // 0.9 tuner -> ~72 neighbors (Very abstract)
    // 1.0 tuner -> 100 neighbors (Total chaos)
    const easedTuner = Math.pow(this.tunerValue, 3);
    const jitter = 1 + (Math.random() * this.tunerValue * 0.5);
    const k = Math.max(1, Math.floor(easedTuner * 100 * jitter));

    let finalChordId = B.id;
    this.lastSelectionWasOriginal = false; // Reset every step

    try {
      if (this.selectedStrategy === 'knn') {
        const neighbors = LatentMath.knnSubstitution(B, k);
        neighbors.push(B);
        // Randomly pick from k-neighbors to create a "shimmering" effect
        if (Array.isArray(neighbors) && neighbors.length > 0) {
          const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
          finalChordId = chosen ? chosen.id : B.id;
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

      // Check if we hit the "perfect signal"
      if (finalChordId === B.id) {
        this.lastSelectionWasOriginal = true;
        // Reset after a short delay so the UI can "pulse" again next time
        setTimeout(() => { this.lastSelectionWasOriginal = false; }, 100);
      }

      this.saveSnapshotToHistory(B, finalChordId);
    } catch (e) {
      console.warn("Broadcaster: Substitution error, falling back to original.", e);
      finalChordId = B.id;
    }

    // Update the audio engine with the new target chord
    const driftedChord = LatentMath.getChordById(finalChordId);
    setNextLatentChord(driftedChord || B);
  },

  saveSnapshotToHistory(B, finalChordId) {

    if (!this.debugChorale) return;

    const snapshot = {
      timestamp: Date.now(),
      phraseId: this.currentPhrase.id,
      stepIndex: this.stepIndex,
      originalChordId: B.id,
      playedChordId: finalChordId,
      strategy: this.selectedStrategy,
      tunerValue: this.tunerValue,
      isOriginal: finalChordId === B.id
    };
    this.stepHistory.push(snapshot);

    // Keep the history from growing infinitely
    if (this.stepHistory.length > this.MAX_STEP_HISTORY) {
      this.stepHistory.shift();
    }
  },

  logStationSummary() {
    if (!this.currentPhrase || this.stepHistory.length === 0) return;

    console.group(`%c 📻 Station Summary: ${this.currentPhrase.id} - ${this.currentPhrase.name} `, "background: #222; color: #bada55; font-weight: bold;");

    // Filter history to only include steps from the chorale just played
    const sessionData = this.stepHistory.map(s => ({
      Step: s.stepIndex,
      Original: s.originalChordId,
      Played: s.playedChordId,
      Strategy: s.strategy,
      Dial: s.tunerValue.toFixed(2),
      Status: s.isOriginal ? "✅ Pure" : "✨ Drifted"
    }));

    console.table(sessionData);

    // Calculate a quick "Drift Score"
    const driftCount = sessionData.filter(s => s.Status === "✨ Drifted").length;
    const driftPercentage = ((driftCount / sessionData.length) * 100).toFixed(1);

    console.log(`Final Report: ${driftPercentage}% of this chorale was reimagined by the Latent Engine.`);

    console.log(this.stepHistory.map(s => (s.playedChordId)));

    console.groupEnd();

    // Clear the history for the next station
    this.stepHistory = [];
  },

  downloadSessionJSON() {
    if (this.stepHistory.length === 0) return;

    const dataStr = JSON.stringify({
      chorale: this.currentPhrase.name,
      id: this.currentPhrase.id,
      timestamp: new Date().toISOString(),
      performance: this.stepHistory
    }, null, 2);

    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `Bach_Latent_${this.currentPhrase.id}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log("💾 Performance data saved to disk.");
  },
});