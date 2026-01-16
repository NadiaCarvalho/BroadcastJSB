<script setup>
import { ref, watch, onMounted } from 'vue';
import * as Tone from 'tone';

// Components
import TunerDial from '../components/TunerDial.vue';
import SignalMeter from '../components/SignalMeter.vue';
import TuningLED from '../components/TuningLED.vue';

// Logic & Data
import { Broadcaster } from '../logic/broadcaster';
import { startRadioTransport, startAudioContext, updateNoiseFloor } from '../logic/audioPlayback';
import latentJson from '../data/chords_bach_all.json';

// --- STATE ---
const tunerValue = ref(0);
const isEngineStarted = ref(false);
const activeChordId = ref('---');

// --- INITIALIZATION ---
onMounted(() => {
    // Initialize the navigation engine with the Bach chord dictionary
    Broadcaster.init(latentJson.chords);
});

async function handlePowerOn() {
    await startAudioContext();
    startRadioTransport();
    isEngineStarted.value = true;

    // Trigger initial chord calculation
    Broadcaster.updateTuning(tunerValue.value);
}

// --- WATCHERS ---
watch(tunerValue, (newVal) => {
    if (!isEngineStarted.value) return;

    // 1. Update the Navigation Logic (k-NN / AD)
    Broadcaster.updateTuning(newVal);

    // 2. Update the Audio Noise/Crackle based on signal strength
    updateNoiseFloor(newVal);

    // 3. Update the UI Readout
    if (Broadcaster.currentChord) {
        activeChordId.value = Broadcaster.currentChord.id;
    }
});
</script>

<template>
    <div class="radio-installation-wrapper">
        <div class="faceplate">

            <div class="header-section">
                <div class="brand-badge">
                    <h1>BROADCAST <span class="highlight">JSB</span></h1>
                    <p class="subtitle">LATENT CHORALE RECEIVER • MODEL 1723</p>
                </div>
                <SignalMeter :tuner-value="tunerValue" :is-scanning="Broadcaster.isScanning" />
            </div>

            <div class="display-panel">
                <div class="tuning-indicator">
                    <TuningLED :tuner-value="tunerValue" />
                </div>

                <div class="frequency-readout">
                    <div class="lcd-screen">
                        <span class="mhz">{{ (88 + tunerValue * 20).toFixed(1) }}</span>
                        <span class="unit">MHz</span>
                    </div>
                    <div class="chord-id-display">
                        TRACKING ID: {{ activeChordId }}
                    </div>
                </div>

                <div class="status-badge">
                    <div :class="['dot', { 'dot-active': isEngineStarted }]"></div>
                    <span>{{ isEngineStarted ? 'LIVE' : 'OFF AIR' }}</span>
                </div>
            </div>

            <div class="control-grid">
                <div class="dial-wrapper">
                    <TunerDial v-model="tunerValue" />
                </div>

                <div class="power-section">
                    <button v-if="!isEngineStarted" @click="handlePowerOn" class="power-btn">
                        INITIALIZE VACUUM TUBES
                    </button>
                    <div v-else class="playback-hint">
                        <p>ROTATE DIAL TO NAVIGATE THE MANIFOLD</p>
                        <div class="knob-shadow"></div>
                    </div>
                </div>
            </div>

            <footer class="faceplate-footer">
                <span>TONAL LATTICE DECODER v4.0</span>
                <span>LEIPZIG, GERMANY</span>
            </footer>
        </div>
    </div>
</template>

<style scoped>
.radio-installation-wrapper {
    min-height: 100vh;
    background-color: #0a0a0a;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: 'Courier New', Courier, monospace;
}

.faceplate {
    width: 500px;
    background: #2a2a2a;
    border: 10px solid #3d3d3d;
    border-radius: 12px;
    padding: 30px;
    box-shadow: inset 0 0 50px rgba(0, 0, 0, 0.5), 0 20px 40px rgba(0, 0, 0, 0.8);
    color: #dcdcdc;
}

/* Header */
.header-section {
    display: flex;
    justify-content: space-between;
    margin-bottom: 30px;
    border-bottom: 2px solid #3d3d3d;
    padding-bottom: 15px;
}

.brand-badge h1 {
    font-size: 1.2rem;
    margin: 0;
    letter-spacing: 2px;
}

.highlight {
    color: #42b983;
}

.subtitle {
    font-size: 0.6rem;
    margin: 5px 0 0 0;
    opacity: 0.6;
}

/* Display LCD */
.display-panel {
    background: #111;
    border: 3px inset #333;
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40px;
}

.lcd-screen {
    color: #42b983;
    text-shadow: 0 0 10px rgba(66, 185, 131, 0.6);
    text-align: center;
}

.mhz {
    font-size: 3rem;
    font-weight: bold;
}

.unit {
    font-size: 1rem;
    margin-left: 5px;
    opacity: 0.8;
}

.chord-id-display {
    font-size: 0.7rem;
    margin-top: 10px;
    color: #42b983;
    opacity: 0.5;
}

/* Controls */
.control-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    align-items: center;
}

.power-btn {
    background: #b33939;
    border: 4px solid #822727;
    color: white;
    padding: 15px;
    cursor: pointer;
    font-weight: bold;
    border-radius: 4px;
    transition: all 0.2s;
}

.power-btn:hover {
    background: #ff5252;
}

.playback-hint p {
    font-size: 0.6rem;
    text-align: center;
    opacity: 0.5;
}

/* Footer */
.faceplate-footer {
    margin-top: 40px;
    display: flex;
    justify-content: space-between;
    font-size: 0.5rem;
    opacity: 0.4;
    letter-spacing: 1px;
}

.dot {
    width: 8px;
    height: 8px;
    background: #333;
    border-radius: 50%;
    margin-bottom: 5px;
}

.dot-active {
    background: #ff5252;
    box-shadow: 0 0 8px #ff5252;
}

.status-badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 0.6rem;
}
</style>