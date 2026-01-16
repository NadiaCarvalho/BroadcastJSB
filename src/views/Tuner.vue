<script setup>
import { ref, watch, onMounted } from 'vue';

// Components
import PowerSwitch from '../components/PowerSwitch.vue';
import TunerDial from '../components/TunerDial.vue';
import SignalMeter from '../components/SignalMeter.vue';
import TuningLED from '../components/TuningLED.vue';

// Logic
import { Broadcaster } from '../logic/broadcaster';
import { 
  startRadioTransport, 
  startAudioContext, 
  stopRadio, 
  updateNoiseFloor 
} from '../logic/audioPlayback';

// Data
import latentJson from '../data/chords_bach_all.json';

// --- STATE ---
const isPoweredOn = ref(false);
const tunerValue = ref(0.1); // Start slightly off-center
const activeChordId = ref('---');

// --- INITIALIZATION ---
onMounted(() => {
  if (latentJson && latentJson.chords) {
    Broadcaster.init(latentJson.chords);
  }
});

// --- POWER LOGIC ---
watch(isPoweredOn, async (on) => {
  if (on) {
    // POWER ON: Initialize and Start
    await startAudioContext();
    startRadioTransport();
    Broadcaster.updateTuning(tunerValue.value);
  } else {
    // POWER OFF: Aggressive silence and cleanup
    stopRadio();
    activeChordId.value = '---';
    Broadcaster.isScanning = false;
  }
});

// --- TUNING LOGIC ---
watch(tunerValue, (val) => {
  if (isPoweredOn.value) {
    // Update the latent navigation
    Broadcaster.updateTuning(val);
    // Update the static and audio filters
    updateNoiseFloor(val);
    
    // Update UI tracking
    if (Broadcaster.currentChord) {
      activeChordId.value = Broadcaster.currentChord.id;
    }
  }
});
</script>

<template>
  <div class="installation-container">
    <div :class="['radio-console', { 'power-is-off': !isPoweredOn }]">
      
      <div class="engraving">
        <div class="logo">𝔅𝔯𝔬𝔞𝔡𝔠𝔞𝔰𝔱 𝔍𝔖𝔅</div>
        <div class="serial">SER. NO. 1723 • LEIPZIG FREQUENCY</div>
      </div>

      <div class="inner-panel">
        
        <div class="display-row">
          <SignalMeter 
            :active="isPoweredOn" 
            :tuner-value="tunerValue" 
            :is-scanning="Broadcaster.isScanning" 
          />
          
          <div class="frequency-window">
            <div class="glass-glare"></div>
            <div 
              class="tuning-needle" 
              :style="{ left: `${tunerValue * 100}%` }"
            ></div>
            <div class="dial-scale">
              <span>88</span><span>92</span><span>96</span><span>100</span><span>104</span><span>108</span>
            </div>
          </div>

          <TuningLED 
            :active="isPoweredOn" 
            :tuner-value="tunerValue" 
          />
        </div>

        <div class="speaker-grill">
          <div class="readout-text" v-if="isPoweredOn">
            CHORD: {{ activeChordId }}
          </div>
          <div class="readout-text offline" v-else>OFF AIR</div>
        </div>

        <div class="control-row">
          <PowerSwitch v-model="isPoweredOn" />
          
          <div class="main-tuner">
            <TunerDial v-model="tunerValue" />
          </div>

          <div class="seal">
            <div class="seal-content">UMAP<br/>PROJECTION</div>
          </div>
        </div>
      </div>

      <div class="screw tl"></div><div class="screw tr"></div>
      <div class="screw bl"></div><div class="screw br"></div>
    </div>
    
    <div class="floor-shadow"></div>
  </div>
</template>

<style scoped>
.installation-container {
  min-height: 100vh;
  background: radial-gradient(circle, #1a1a1a 0%, #020202 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  user-select: none;
}

/* Cabinet Styling */
.radio-console {
  width: 580px;
  background: #3a2a1d; /* Deep Walnut */
  border: 10px solid #281c14;
  border-radius: 15px;
  padding: 45px;
  position: relative;
  box-shadow: 0 40px 80px rgba(0,0,0,0.9);
  transition: filter 0.5s ease;
}

.power-is-off {
  filter: brightness(0.7) contrast(0.9);
}

/* Metal Panel */
.inner-panel {
  background: #141414;
  border: 3px solid #4a3c31;
  border-radius: 6px;
  padding: 25px;
  display: flex;
  flex-direction: column;
  gap: 25px;
  box-shadow: inset 0 0 30px #000;
}

/* Frequency Display */
.frequency-window {
  width: 180px;
  height: 55px;
  background: #1e1610;
  border: 2px solid #3d3d3d;
  position: relative;
  overflow: hidden;
}

.tuning-needle {
  position: absolute;
  top: 0; width: 2px; height: 100%;
  background: #ff3300;
  box-shadow: 0 0 8px #ff3300;
  z-index: 5;
  transition: left 0.1s linear;
}

.dial-scale {
  display: flex;
  justify-content: space-between;
  padding: 30px 10px 0;
  color: #c4a484;
  font-family: 'Courier New', monospace;
  font-size: 0.65rem;
  opacity: 0.7;
}

.glass-glare {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%);
  z-index: 6;
  pointer-events: none;
}

/* Speaker Grill Area */
.speaker-grill {
  height: 35px;
  background: repeating-linear-gradient(90deg, #0a0a0a, #0a0a0a 3px, #1a1a1a 6px);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.readout-text {
  color: #42b983;
  font-family: monospace;
  font-size: 0.7rem;
  letter-spacing: 2px;
  text-shadow: 0 0 5px #42b983;
}

.offline { color: #333; text-shadow: none; }

/* Control Layout */
.display-row, .control-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.engraving {
  text-align: center;
  margin-bottom: 25px;
  color: #a38971;
  font-family: serif;
}

.logo { font-size: 2rem; letter-spacing: 3px; opacity: 0.5; }
.serial { font-size: 0.6rem; opacity: 0.3; margin-top: 5px; }

/* Decorative Elements */
.seal {
  width: 50px; height: 50px;
  border: 1px dashed #3d2b1f;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.seal-content {
  font-size: 0.45rem;
  color: #3d2b1f;
  text-align: center;
  line-height: 1.2;
}

.screw {
  width: 8px; height: 8px;
  background: #444;
  border-radius: 50%;
  position: absolute;
  box-shadow: inset 1px 1px 2px #000;
}
.tl { top: 15px; left: 15px; }
.tr { top: 15px; right: 15px; }
.bl { bottom: 15px; left: 15px; }
.br { bottom: 15px; right: 15px; }

.floor-shadow {
  width: 550px; height: 20px;
  background: rgba(0,0,0,0.6);
  filter: blur(15px);
  margin-top: -10px;
}
</style>