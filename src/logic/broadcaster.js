import { ref, reactive } from 'vue';
import * as Tone from 'tone';

export const Broadcaster = reactive({
  tunerValue: 0.0,
  isScanning: false,
  currentChord: null,
  
  updateTuning(val) {
    const delta = Math.abs(val - this.tunerValue);
    this.isScanning = delta > 0.05; // Threshold for "scrambling"
    this.tunerValue = val;
    
    if (this.isScanning) {
      this.scramble();
    }
  },

  scramble() {
    // Pick random chord ID from your dictionary logic
    // This creates the "searching" sound effect
  }
});