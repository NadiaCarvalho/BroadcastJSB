import { reactive } from 'vue';
import { setNextLatentChord, handleInterstationNoise } from './audioPlayback';

export const Broadcaster = reactive({
  tunerValue: 0,
  isBetweenStations: false,
  chordDict: [],
  phrases: [],
  currentPhrase: null,
  stepIndex: -1,
  currentStepData: null,
  history: [],

  init(chords, phrases) {
    this.chordDict = chords.map(c => ({
      ...c,
      x: c.z2D[0],
      y: c.z2D[1]
    }));
    this.phrases = phrases;
    this.pickRandomStation();
  },

  pickRandomStation() {
    this.isBetweenStations = true;
    setNextLatentChord(null);
    handleInterstationNoise(this.tunerValue, true);

    setTimeout(() => {
      const pool = this.phrases.filter(p => !this.history.includes(p.id));
      const selection = pool.length > 0 ? pool : this.phrases;
      this.currentPhrase = selection[Math.floor(Math.random() * selection.length)];

      this.history.push(this.currentPhrase.id);
      if (this.history.length > 15) this.history.shift();

      this.stepIndex = -1;
      this.isBetweenStations = false;
      handleInterstationNoise(this.tunerValue, false);
    }, 2000);
  },

  nextStep() {
    if (this.isBetweenStations || !this.currentPhrase) return null;

    this.stepIndex++;
    if (this.stepIndex >= this.currentPhrase.sequence.length) {
      this.pickRandomStation();
      return null;
    }

    this.currentStepData = this.currentPhrase.sequence[this.stepIndex];
    this.generateDriftChord();
    return this.currentStepData;
  },

  updateTuning(val) {
    this.tunerValue = val;
    handleInterstationNoise(val, this.isBetweenStations);
    if (this.currentStepData) this.generateDriftChord();
  },

  generateDriftChord() {
    if (!this.currentStepData) return;
    const original = this.chordDict.find(c => c.id === this.currentStepData.id);
    if (!original) return;

    if (this.tunerValue < 0.05) {
      setNextLatentChord(original);
      return;
    }

    const radius = this.tunerValue * 1.5;
    const neighbors = this.chordDict.filter(c =>
      Math.hypot(c.x - original.x, c.y - original.y) <= radius
    );

    setNextLatentChord(neighbors[Math.floor(Math.random() * neighbors.length)] || original);
  }
});