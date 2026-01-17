<script setup>
import { ref, watch, onMounted } from 'vue';

// Components
import PowerSwitch from '../components/PowerSwitch.vue';
import TunerDial from '../components/TunerDial.vue';
import SignalMeter from '../components/SignalMeter.vue';
import TuningLED from '../components/TuningLED.vue';

// Logic
import { Broadcaster } from '../logic/Broadcaster';
import {
    startRadioTransport,
    startAudioContext,
    stopRadio,
    updateNoiseFloor
} from '../logic/audioPlayback';

// Data
import latentJson from '../data/chords_bach_all.json';
import phrasesJson from '../data/phrases.json';

// --- STATE ---
const isPoweredOn = ref(false);
const tunerValue = ref(0.0);

// --- INITIALIZATION ---
onMounted(() => {
    if (latentJson && phrasesJson) {
        Broadcaster.init(latentJson.chords, phrasesJson);
    }
});

// --- POWER LOGIC ---
watch(isPoweredOn, async (on) => {
    if (on) {
        await startAudioContext();
        startRadioTransport();
        Broadcaster.updateTuning(tunerValue.value);
    } else {
        stopRadio();
        Broadcaster.isBetweenStations = false;
    }
});

// --- TUNING LOGIC ---
watch(tunerValue, (val) => {
    if (isPoweredOn.value) {
        Broadcaster.updateTuning(val);
        updateNoiseFloor(val);
    }
});
</script>

<template>
    <div class="installation-container">
        <div :class="['radio-console', { 'power-off': !isPoweredOn }]">

            <div class="cabinet-header">
                <div class="brand">𝔅𝔯𝔬𝔞𝔡𝔠𝔞𝔰𝔱 𝔍𝔖𝔅</div>
                <div class="sub-brand">LATENT MANIFOLD RECEIVER</div>
            </div>

            <div class="main-panel">

                <div class="display-row">
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

                <div class="info-strip">
                    <Transition name="fade" mode="out-in">
                        <div v-if="!isPoweredOn" class="status-msg offline">OFF AIR</div>
                        <div v-else-if="Broadcaster.isBetweenStations" class="status-msg scanning">
                            SCANNING LATENT SPACE...
                        </div>
                        <div v-else class="status-msg active">
                            STATION: {{ Broadcaster.currentPhrase?.name }}
                        </div>
                    </Transition>
                </div>

                <div class="control-row">
                    <div class="power-unit">
                        <PowerSwitch v-model="isPoweredOn" />
                    </div>

                    <div class="tuner-unit">
                        <TunerDial v-model="tunerValue" />
                    </div>

                    <div class="calibration-seal">
                        <div class="seal-inner">CERTIFIED BACH</div>
                    </div>
                </div>
            </div>

            <div class="rivet tl"></div>
            <div class="rivet tr"></div>
            <div class="rivet bl"></div>
            <div class="rivet br"></div>
        </div>

        <div class="console-shadow"></div>
        <footer class="faceplate-footer">
            <span>TONAL LATTICE DECODER v1.0</span>
            <span>LEIPZIG, GERMANY</span>
        </footer>
    </div>
</template>

<style scoped>
.installation-container {
    min-height: 100vh;
    /* Lighter background gradient */
    background: radial-gradient(circle, #2a2a2a 0%, #111 100%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    overflow: hidden;
}

.radio-console {
    width: 600px;
    background: #4a3528; /* Slightly lighter Walnut */
    border: 12px solid #36261c;
    border-radius: 12px;
    padding: 40px;
    position: relative;
    box-shadow: 0 40px 80px rgba(0, 0, 0, 0.6);
    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Softer Power Off: Still visible, just less "glowy" */
.power-off {
    filter: brightness(0.85) saturate(0.8);
}

.power-off .main-panel {
    background: #1a1a1a; /* Lighter than pure black when off */
    box-shadow: inset 0 0 20px #000;
}

.main-panel {
    background: #121212;
    border: 2px solid #5a4b41;
    border-radius: 4px;
    padding: 25px;
    display: flex;
    flex-direction: column;
    gap: 25px;
    box-shadow: inset 0 0 40px #000;
    transition: background 0.8s ease;
}

.frequency-window {
    width: 180px;
    height: 55px;
    background: #241c14; /* Slightly lighter background */
    border: 1px solid #444;
    position: relative;
    overflow: hidden;
}

.needle {
    position: absolute;
    top: 0;
    width: 2px;
    height: 100%;
    background: #ff4d00;
    box-shadow: 0 0 8px #ff4d00;
    z-index: 5;
    transition: left 0.15s ease-out, opacity 0.5s ease;
}

/* Dim the needle when off */
.power-off .needle {
    opacity: 0.3;
    box-shadow: none;
}

.scale-numbers {
    display: flex;
    justify-content: space-between;
    padding: 30px 10px 0;
    color: #a68b6d; /* Increased contrast for readability */
    font-family: 'Courier New', monospace;
    font-size: 0.6rem;
    opacity: 0.8;
}

.info-strip {
    height: 40px;
    background: #0d0d0d;
    border-radius: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-top: 1px solid #222;
}

.status-msg {
    font-family: 'Courier New', monospace;
    font-size: 0.7rem;
    letter-spacing: 1px;
}

.active {
    color: #42b983;
    text-shadow: 0 0 8px rgba(66, 185, 131, 0.6);
}

.scanning {
    color: #f1c40f;
    animation: blink 1s infinite;
}

.offline {
    color: #444; /* Visible but clearly 'unpowered' */
}

.display-row,
.control-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.cabinet-header {
    text-align: center;
    margin-bottom: 30px;
    color: #a68b6d;
}

.brand {
    font-size: 1.8rem;
    font-family: serif;
    opacity: 0.8;
    letter-spacing: 4px;
}

.sub-brand {
    font-size: 0.5rem;
    letter-spacing: 2px;
    margin-top: 5px;
    opacity: 0.6;
}

.rivet {
    width: 10px;
    height: 10px;
    background: #444;
    border-radius: 50%;
    position: absolute;
    box-shadow: inset 1px 1px 2px #000, 1px 1px 1px rgba(255,255,255,0.05);
}

.tl { top: 15px; left: 15px; }
.tr { top: 15px; right: 15px; }
.bl { bottom: 15px; left: 15px; }
.br { bottom: 15px; right: 15px; }

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

@keyframes blink {
    50% { opacity: 0.3; }
}

.console-shadow {
    width: 580px;
    height: 30px;
    background: rgba(0, 0, 0, 0.4);
    filter: blur(20px);
    margin-top: -15px;
}

.faceplate-footer {
    margin-top: 40px;
    display: flex;
    justify-content: space-between;
    width: 600px;
    font-size: 0.5rem;
    color: #666;
    letter-spacing: 1px;
}

.calibration-seal {
  width: 60px; height: 60px;
  border: 2px dashed #5a4b41;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
  opacity: 0.7;
}

.seal-inner {
  font-size: 0.4rem;
  color: #a68b6d;
  text-align: center;
  font-weight: bold;
}
</style>