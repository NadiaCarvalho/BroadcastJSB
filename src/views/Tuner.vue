<script setup>
import { ref, watch, onMounted } from 'vue';

// Components
import PowerSwitch from '../components/PowerSwitch.vue';
import TunerDial from '../components/TunerDial.vue';
import SignalMeter from '../components/SignalMeter.vue';
import TuningLED from '../components/TuningLED.vue';

// Logic
import { Broadcaster } from '../logic/broadcaster';
import { startRadioTransport, startAudioContext, stopRadio, updateNoiseFloor } from '../logic/audioPlayback';
import latentJson from '../data/chords_bach_all.json';

// --- STATE ---
const isPoweredOn = ref(false);
const tunerValue = ref(0.2); // Initial "station" position

// --- INITIALIZATION ---
onMounted(() => {
    Broadcaster.init(latentJson.chords);
});

// --- POWER LOGIC ---
watch(isPoweredOn, async (on) => {
    if (on) {
        await startAudioContext();
        startRadioTransport();
        Broadcaster.updateTuning(tunerValue.value);
    } else {
        stopRadio();
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
        <div class="radio-console">

            <div class="engraving">
                <div class="logo">𝔅𝔯𝔬𝔞𝔡𝔠𝔞𝔰𝔱 𝔍𝔖𝔅</div>
                <div class="serial">SER. NO. 1723-LATENT</div>
            </div>

            <div class="inner-panel">

                <div class="display-row">
                    <SignalMeter :active="isPoweredOn" :tuner-value="tunerValue"
                        :is-scanning="Broadcaster.isScanning" />

                    <div class="frequency-window">
                        <div class="glass-overlay"></div>
                        <div class="frequency-needle" :style="{ left: `${tunerValue * 100}%` }"></div>
                        <div class="frequency-numbers">
                            <span>88</span><span>92</span><span>96</span><span>100</span><span>104</span><span>108</span>
                        </div>
                    </div>

                    <TuningLED :active="isPoweredOn" :tuner-value="tunerValue" />
                </div>

                <div class="speaker-grill">
                    <div class="mesh"></div>
                    <div class="status-readout" v-if="isPoweredOn">
                        RECEIVING: {{ Broadcaster.currentChord?.id || 'SEARCHING...' }}
                    </div>
                </div>

                <div class="control-row">
                    <PowerSwitch v-model="isPoweredOn" />

                    <div class="dial-section">
                        <TunerDial v-model="tunerValue" />
                    </div>

                    <div class="calibration-seal">
                        <div class="seal-inner">CERTIFIED BACH</div>
                    </div>
                </div>
            </div>

            <div class="chassis-screws">
                <div class="screw top-left"></div>
                <div class="screw top-right"></div>
                <div class="screw bottom-left"></div>
                <div class="screw bottom-right"></div>
            </div>
        </div>

        <div class="ambient-shadow"></div>
    </div>
</template>

<style scoped>
.installation-container {
    min-height: 100vh;
    background: radial-gradient(circle, #1a1a1a 0%, #050505 100%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    perspective: 1000px;
}

/* The Wooden Cabinet */
.radio-console {
    width: 580px;
    background: #3d2b1f;
    /* Walnut-ish color */
    border: 12px solid #2a1d15;
    border-radius: 20px 20px 5px 5px;
    padding: 40px;
    box-shadow:
        0 30px 60px rgba(0, 0, 0, 0.9),
        inset 0 2px 10px rgba(255, 255, 255, 0.1);
    position: relative;
}

/* Metal Inner Plate */
.inner-panel {
    background: #1a1a1a;
    border: 4px solid #4a3c31;
    border-radius: 8px;
    padding: 30px;
    box-shadow: inset 0 0 20px #000;
    display: flex;
    flex-direction: column;
    gap: 30px;
}

/* Frequency Display Window */
.frequency-window {
    width: 180px;
    height: 60px;
    background: #221a10;
    border: 2px solid #555;
    position: relative;
    overflow: hidden;
}

.glass-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(rgba(255, 255, 255, 0.1), transparent);
    z-index: 2;
}

.frequency-needle {
    position: absolute;
    top: 0;
    width: 2px;
    height: 100%;
    background: #ff4500;
    box-shadow: 0 0 5px #ff4500;
    transition: left 0.2s ease-out;
    z-index: 3;
}

.frequency-numbers {
    display: flex;
    justify-content: space-between;
    padding: 35px 10px 5px;
    color: #c4a484;
    font-family: 'Courier New', monospace;
    font-size: 0.7rem;
    opacity: 0.8;
}

/* Speaker Grill Aesthetic */
.speaker-grill {
    height: 40px;
    background: repeating-linear-gradient(90deg, #111, #111 2px, #222 4px);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.status-readout {
    color: #42b983;
    font-family: monospace;
    font-size: 0.65rem;
    letter-spacing: 1px;
    text-shadow: 0 0 5px #42b983;
}

/* Branding */
.engraving {
    text-align: center;
    margin-bottom: 25px;
    color: #c4a484;
    opacity: 0.4;
    font-family: serif;
}

.logo {
    font-size: 1.8rem;
    letter-spacing: 4px;
}

.serial {
    font-size: 0.6rem;
    margin-top: 5px;
}

/* Control Layout */
.display-row,
.control-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.calibration-seal {
    width: 60px;
    height: 60px;
    border: 2px dashed #4a3c31;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 5px;
}

.seal-inner {
    font-size: 0.4rem;
    color: #4a3c31;
    text-align: center;
    font-weight: bold;
}

/* Decorative Screws */
.screw {
    width: 8px;
    height: 8px;
    background: #555;
    border-radius: 50%;
    position: absolute;
    box-shadow: inset 1px 1px 2px #000;
}

.top-left {
    top: 15px;
    left: 15px;
}

.top-right {
    top: 15px;
    right: 15px;
}

.bottom-left {
    bottom: 15px;
    left: 15px;
}

.bottom-right {
    bottom: 15px;
    right: 15px;
}

.ambient-shadow {
    width: 600px;
    height: 20px;
    background: rgba(0, 0, 0, 0.5);
    filter: blur(15px);
    margin-top: -10px;
}
</style>