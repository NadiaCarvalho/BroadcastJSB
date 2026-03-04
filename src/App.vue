<script setup>
import { ref, watch, onMounted } from 'vue';

// Components
import PowerSwitch from './components/PowerSwitch.vue';
import TunerDial from './components/TunerDial.vue';
import SignalMeter from './components/SignalMeter.vue';
import TuningLED from './components/TuningLED.vue';
import VUMeter from './components/VUMeter.vue';
import StrategyChooser from './components/StrategyChooser.vue'

// Logic
import { Broadcaster } from './logic/broadcaster';
import {
  startRadioTransport,
  startAudioContext,
  stopRadio,
  updateNoiseFloor,
  setMasterVolume
} from './logic/audioPlayback';

// Data
import latentJson from './data/chords_bach_all.json';
import phrasesJson from './data/chorales.json';

// --- STATE ---
const isPoweredOn = ref(false);
const tunerValue = ref(0.0);
const volumeValue = ref(0.5);

onMounted(() => {
  if (latentJson && phrasesJson) {
    Broadcaster.init(latentJson.chords, phrasesJson);
    updateNoiseFloor(tunerValue.value);
  }
});

watch(isPoweredOn, async (on) => {
  if (on) {
    await startAudioContext();
    setMasterVolume(volumeValue.value);
    startRadioTransport();
    Broadcaster.updateTuning(tunerValue.value);
  } else {
    stopRadio();
    Broadcaster.isBetweenStations = false;
  }
});

watch(tunerValue, (val) => {
  if (isPoweredOn.value) {
    Broadcaster.updateTuning(val);
    updateNoiseFloor(val);
  }
});

watch(volumeValue, (val) => {
  if (isPoweredOn.value) {
    setMasterVolume(val);
  }
});
</script>

<template>
  <div id="app" class="app-container">
    <div class="installation-container">
      <div :class="['radio-console', { 'power-off': !isPoweredOn }]">

        <div class="cabinet-header">
          <div class="brand">𝔅𝔯𝔬𝔞𝔡𝔠𝔞𝔰𝔱 𝔍𝔖𝔅</div>
          <div class="sub-brand">LATENT MANIFOLD RECEIVER</div>
        </div>

        <div class="main-panel">
          <div class="panel-row">
            <SignalMeter :active="isPoweredOn" :tuner-value="tunerValue"
              :is-scanning="Broadcaster.isScanning || Broadcaster.isBetweenStations" />

            <div class="frequency-window">
              <div class="glass-sheen"></div>
              <div class="needle" :style="{ left: `${tunerValue * 100}%` }"></div>
              <div class="scale-numbers">
                <span>88</span><span>92</span><span>98</span><span>102</span><span>108</span>
              </div>
            </div>

            <TuningLED :active="isPoweredOn" :tuner-value="tunerValue" />
          </div>

          <div class="speaker-grill-section">
            <div class="mesh-pattern"></div>
            <div class="mesh-overlay"></div>
            <div class="info-strip">
              <Transition name="fade" mode="out-in">
                <div v-if="!isPoweredOn" class="status-msg offline">OFF AIR</div>
                <div v-else-if="Broadcaster.isBetweenStations" class="status-msg scanning">
                  SCANNING LATENT SPACE...
                </div>
                <div v-else class="status-msg active">
                  STATION: {{ Broadcaster.currentPhrase?.id }}
                  <p class="status-msg active small">"{{ Broadcaster.currentPhrase?.name }}"</p>
                </div>
              </Transition>
            </div>
          </div>

          <div class="panel-row controls-layout">
            <div class="control-unit">
              <div class="unit-label">SYSTEM</div>
              <PowerSwitch v-model="isPoweredOn" />
            </div>

            <div class="control-unit">
              <div class="unit-label">TUNING</div>
              <TunerDial v-model="tunerValue" :size="174" :strategy="Broadcaster.selectedStrategy"/>
            </div>

            <div class="control-unit audio-group">
              <div class="unit-label">OUTPUT</div>
              <VUMeter :active="isPoweredOn" />
              <div class="knob-spacer"></div>
              <TunerDial v-model="volumeValue" :size="55" :labels="['MIN', 'MAX']" />
            </div>

            <div class="control-unit decoder-stack">
              <div class="unit-label">DECODER</div>
              <StrategyChooser />
              <div class="seal-spacer"></div>
              <div :class="['calibration-seal', { 'flicker': Broadcaster.isBetweenStations }]">
                <div class="seal-inner"><span class="seal-text">CERTIFIED<br />JSB</span></div>
              </div>
            </div>
          </div>
        </div>

        <div class="rivet tl"></div>
        <div class="rivet tr"></div>
        <div class="rivet bl"></div>
        <div class="rivet br"></div>
      </div>

      <footer class="faceplate-footer">
        <span>TONAL LATTICE DECODER v1.0</span>
        <span>LEIPZIG, GERMANY</span>
      </footer>
    </div>
  </div>
</template>

<style>
.installation-container {
  min-height: 100vh;
  background: radial-gradient(circle, #2a2a2a 0%, #111 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.radio-console {
  width: 650px;
  background: #4a3528;
  /* Walnut Wood Cabinet */
  border: 12px solid #36261c;
  border-radius: 12px;
  padding: 40px;
  position: relative;
  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.6);
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.power-off {
  filter: brightness(0.85) saturate(0.8);
}

.main-panel {
  background: #121212;
  border: 2px solid #5a4b41;
  border-radius: 4px;
  padding: 30px;
  display: flex;
  flex-direction: column;
  gap: 30px;
  box-shadow: inset 0 0 40px #000;
}

.panel-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.controls-layout {
  align-items: flex-end;
}

/* --- SPEAKER GRILL STYLING --- */
.speaker-grill-section {
  position: relative;
  height: 85px;
  background: #050505;
  border-radius: 4px;
  border: 2px solid #2a1b12;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: inset 0 0 20px #000;
}

.mesh-pattern {
  position: absolute;
  inset: 0;
  /* Deep brass/wood toned mesh dots */
  background-image: radial-gradient(circle, #3d2b1f 25%, transparent 30%);
  background-size: 6px 6px;
  opacity: 0.7;
}

.mesh-overlay {
  position: absolute;
  inset: 0;
  /* Simulates a fine vertical fabric weave or shadow */
  background: repeating-linear-gradient(90deg,
      transparent,
      transparent 2px,
      rgba(0, 0, 0, 0.5) 4px);
  pointer-events: none;
}

.info-strip {
  z-index: 10;
  background: #0d0d0d;
  padding: 8px 35px;
  border: 1px solid #3a2a1d;
  border-radius: 2px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.8);
  min-width: 300px;
  text-align: center;
}

/* --- UNIT COMPONENTS --- */
.control-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 90px;
}

.audio-group {
  gap: 10px;
}

.knob-spacer {
  height: 5px;
}

.unit-label {
  font-family: 'Courier New', monospace;
  font-size: 0.6rem;
  color: #a68b6d;
  margin-bottom: 12px;
  letter-spacing: 2px;
  font-weight: bold;
  text-transform: uppercase;
}

/* --- FREQUENCY WINDOW --- */
.frequency-window {
  width: 220px;
  height: 65px;
  background: #241c14;
  border: 1px solid #444;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 0 10px #000;
}

.glass-sheen {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  z-index: 6;
  pointer-events: none;
}

.needle {
  position: absolute;
  top: 0;
  width: 2px;
  height: 100%;
  background: #ff4d00;
  box-shadow: 0 0 8px #ff4d00;
  z-index: 5;
  transition: left 0.15s ease-out;
}

.scale-numbers {
  display: flex;
  justify-content: space-between;
  padding: 38px 12px 0;
  color: #a68b6d;
  font-family: 'Courier New', monospace;
  font-size: 0.65rem;
  opacity: 0.8;
}

.status-msg {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  letter-spacing: 2px;
}

.active {
  color: #42b983;
  text-shadow: 0 0 8px rgba(66, 185, 131, 0.6);
}

.status-msg.small {
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  letter-spacing: 2px;
  margin-bottom: 0;
}

.scanning {
  color: #f1c40f;
  animation: blink 1.5s infinite;
}

.offline {
  color: #444;
}

/* --- CABINET DETAILS --- */
.cabinet-header {
  text-align: center;
  margin-bottom: 25px;
  color: #a68b6d;
}

.brand {
  font-size: 2.2rem;
  font-family: serif;
  letter-spacing: 5px;
}

.sub-brand {
  font-size: 0.6rem;
  letter-spacing: 3px;
  opacity: 0.6;
  margin-top: 5px;
}

.rivet {
  width: 10px;
  height: 10px;
  background: #444;
  border-radius: 50%;
  position: absolute;
  box-shadow: inset 1px 1px 2px #000;
}

.tl {
  top: 15px;
  left: 15px;
}

.tr {
  top: 15px;
  right: 15px;
}

.bl {
  bottom: 15px;
  left: 15px;
}

.br {
  bottom: 15px;
  right: 15px;
}

.faceplate-footer {
  margin-top: 45px;
  display: flex;
  justify-content: space-between;
  width: 650px;
  font-size: 0.6rem;
  color: #666;
  opacity: 0.6;
}

.calibration-seal {
  width: 70px;
  height: 70px;
  border: 2px dashed #5a4b41;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.03);
}

.seal-inner {
  font-size: 0.5rem;
  color: #a68b6d;
  text-align: center;
  line-height: 1.2;
}

@keyframes blink {
  50% {
    opacity: 0.3;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.decoder-stack {
  justify-content: flex-end;
  /* Keeps labels aligned at top */
  height: 100%;
}

.seal-spacer {
  height: 15px;
  /* Adjust gap between buttons and seal */
}

.calibration-seal {
  width: 80px;
  height: 80px;
  border: 2px dashed #5a4b41;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1a1410;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 0 15px #000;
}

.calibration-seal::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url("@/assets/Johann_Sebastian_Bach.jpg");
  background-size: cover;
  background-position: center 10%;
  filter: sepia(1) contrast(1.2) brightness(0.7) grayscale(0.5);
  opacity: 0.4;
  mix-blend-mode: luminosity;
  pointer-events: none;
  transition: opacity 0.5s ease;
}

/* THE FLICKER LOGIC */
.calibration-seal.flicker::before {
  animation: signal-jitter 0.2s infinite;
}

.calibration-seal.flicker::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  opacity: 0.15;
  z-index: 1;
  pointer-events: none;
}

@keyframes signal-jitter {
  0% {
    opacity: 0.1;
    filter: brightness(0.2) blur(1px);
  }

  20% {
    opacity: 0.3;
    filter: brightness(0.5) blur(0px);
  }

  40% {
    opacity: 0.05;
    filter: brightness(0.1) blur(2px);
  }

  60% {
    opacity: 0.2;
    filter: brightness(0.4) blur(0px);
  }

  80% {
    opacity: 0.15;
    filter: brightness(0.3) blur(1px);
  }

  100% {
    opacity: 0.1;
    filter: brightness(0.2) blur(1px);
  }
}

/* Ensure the seal dims when powered off as well */
.power-off .calibration-seal::before {
  opacity: 0 !important;
  animation: none !important;
}

/* Dim the indicator lights when power is off */
.power-off .indicator-light {
  background: #000 !important;
  box-shadow: none !important;
}

html,
body {
  height: 100%;
  margin: 0;

  background-color: black;
}

/* Basic styles */
.app-container {
  width: 100%;
  height: 100%;

  font-family: sans-serif;
  color: #ccc;

  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  align-content: space-around;
  justify-content: space-around;
  align-items: center;
}
</style>./logic/broadcaster