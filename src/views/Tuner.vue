<script setup>
import { ref, watch } from 'vue';

// --- IMPORTS ---
import TunerDial from './../components/TunerDial.vue';
import SignalMeter from './../components/SignalMeter.vue';

import { Broadcaster } from './../logic/broadcaster.js';
import { startRadioTransport, startAudioContext } from './../logic/audioPlayback.js';

const tunerValue = ref(0);
const isEngineStarted = ref(false);

async function startRadio() {
    await startAudioContext();
    startRadioTransport();
    isEngineStarted.value = true;
}

watch(tunerValue, (val) => {
    Broadcaster.updateTuning(val);
});
</script>

<template>
    <div class="radio-interface">
        <div class="faceplate">
            <div class="top-row">
                <SignalMeter :tuner-value="tunerValue" :is-scanning="Broadcaster.isScanning" />
                <div class="brand">BROADCAST JSB</div>
            </div>
            <div class="dial-section">
                <TunerDial v-model="tunerValue" />
            </div>
            <button v-if="!isEngineStarted" @click="startRadio" class="power-btn">POWER ON</button>
        </div>
    </div>
</template>

<style scoped>
.top-row {
    margin-bottom: 2em;
}

.dial-selection {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 2em;
}

.radio-interface {
    display: flex;
    justify-content: center;
    padding: 50px;
    background: #111;
    min-height: 100vh;
}

.faceplate {
    background: #2c2c2c;
    padding: 30px;
    border-radius: 15px;
    border: 8px solid #3d3d3d;
    width: 400px;
}

.power-btn {
    margin-top: 20px;
    width: 100%;
    padding: 10px;
    background: #e74c3c;
    color: white;
    border: none;
    cursor: pointer;
}
</style>