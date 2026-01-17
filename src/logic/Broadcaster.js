import { reactive } from 'vue';
import { setNextLatentChord, handleInterstationNoise } from './audioPlayback';

export const Broadcaster = reactive({
  // --- UI & CONTROL STATE ---
  tunerValue: 0,
  isScanning: false,
  isBetweenStations: false,
  
  // --- DATA STORAGE ---
  chordDict: [],
  phrases: [],
  
  // --- SEQUENCER STATE ---
  currentPhrase: null,
  stepIndex: 0,
  currentChord: null,
  lastChord: null,

  /**
   * Initialize with Chord Dictionary and Seed Phrases
   */
  init(chords, phrases) {
    if (!chords.length || !phrases.length) return;

    this.chordDict = chords.map(c => ({
      ...c,
      x: c.z2D[0],
      y: c.z2D[1]
    }));
    
    this.phrases = phrases;
    this.pickRandomStation();
  },

  /**
   * Switches to a new random chorale from the JSON library
   */
  pickRandomStation() {
    this.isBetweenStations = true;
    this.currentChord = null;
    setNextLatentChord(null); // Silence the audio during the transition

    // Update the audio engine to play "inter-station" static
    handleInterstationNoise(this.tunerValue, true);

    // Simulate the time it takes for a radio to find a new frequency
    const pauseDuration = 2000 + Math.random() * 2000; 
    
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * this.phrases.length);
      this.currentPhrase = this.phrases[randomIndex];
      this.stepIndex = 0;
      this.isBetweenStations = false;
      
      // Return noise to knob-controlled levels
      handleInterstationNoise(this.tunerValue, false);
      
      this.generateDriftChord();
      console.log(`Broadcasting: ${this.currentPhrase.name}`);
    }, pauseDuration);
  },

  /**
   * Called by the Audio Pulse (Tactus) in audioPlayback.js
   */
  nextStep() {
    if (this.isBetweenStations || !this.currentPhrase) return;

    this.stepIndex++;

    // Check if the current chorale has finished
    if (this.stepIndex >= this.currentPhrase.chordIds.length) {
      this.pickRandomStation();
    } else {
      this.generateDriftChord();
    }
  },

  /**
   * Knob Interaction
   */
  updateTuning(val) {
    const delta = Math.abs(val - this.tunerValue);
    this.isScanning = delta > 0.07;
    this.tunerValue = val;
    
    // Update background noise floor based on knob turn
    handleInterstationNoise(this.tunerValue, this.isBetweenStations);
    
    // Recalculate the current chord drift immediately if we aren't pausing
    if (!this.isBetweenStations) {
      this.generateDriftChord();
    }
  },

  /**
   * Core AI Logic: Finds the drifted version of the current Bach chord
   */
  generateDriftChord() {
    if (!this.currentPhrase || this.isBetweenStations) return;

    // 1. Locate the "Ground Truth" chord from Bach
    const originalId = this.currentPhrase.chordIds[this.stepIndex];
    const originalChord = this.chordDict.find(c => c.id === originalId);

    if (!originalChord) {
      this.pickRandomStation(); // Safety fallback
      return;
    }

    // 2. If the knob is at 0, play perfect Bach.
    if (this.tunerValue < 0.05) {
      this.currentChord = originalChord;
      setNextLatentChord(this.currentChord);
      return;
    }

    // 3. Calculate "Drift Radius" based on the knob
    // We search the z2D manifold for neighbors
    const searchRadius = this.tunerValue * 1.5; 

    const neighbors = this.chordDict
      .filter(c => {
        const d = Math.hypot(c.x - originalChord.x, c.y - originalChord.y);
        return d <= searchRadius;
      })
      // Sort by a blend of distance and randomness for variety
      .sort((a, b) => Math.random() - 0.5);

    // 4. Select the best match (or fall back to original if no neighbors)
    this.currentChord = neighbors.length > 0 ? neighbors[0] : originalChord;
    setNextLatentChord(this.currentChord);
  }
});