<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { getLevel } from '../logic/audioPlayback';

const props = defineProps(['active']);
const needleRotation = ref(-45);

let raf;
const update = () => {
    if (props.active) {
        const level = getLevel();
        // Physics-based smoothing (interpolation) for a heavy analog feel
        const target = (level * 90) - 45;
        needleRotation.value += (target - needleRotation.value) * 0.25;
    } else {
        // Drop the needle when power is lost
        needleRotation.value += (-45 - needleRotation.value) * 0.1;
    }
    raf = requestAnimationFrame(update);
};

onMounted(update);
onUnmounted(() => cancelAnimationFrame(raf));
</script>

<template>
    <div class="vu-container">
        <div class="label">OUTPUT LEVEL</div>
        <div class="meter-face">
            <div class="glass-glare"></div>

            <svg viewBox="0 0 100 50">
                <path d="M10 45 A 40 40 0 0 1 90 45" fill="none" stroke="#222" stroke-width="5" />
                <path d="M72 18 A 40 40 0 0 1 90 45" fill="none" stroke="#ff4d00" stroke-width="2.5" />

                <line x1="50" y1="45" x2="50" y2="12" stroke="#fff" stroke-width="1.2"
                    :style="{ transform: `rotate(${needleRotation}deg)`, transformOrigin: '50px 45px' }" />

                <circle cx="50" cy="45" r="3.5" fill="#1a1a1a" stroke="#333" stroke-width="1" />
            </svg>
        </div>
    </div>
</template>

<style scoped>
.vu-container {
    width: 105px;
    background: #0d0d0d;
    padding: 6px;
    border-radius: 4px;
    border: 1px solid #333;
    box-shadow: inset 0 2px 10px #000;
}

.label {
    font-size: 0.45rem;
    color: #666;
    text-align: center;
    margin-bottom: 4px;
    font-weight: bold;
    letter-spacing: 0.5px;
}

.meter-face {
    position: relative;
    overflow: hidden;
    border-radius: 2px;
    background: #050505;
}

.glass-glare {
    position: absolute;
    inset: 0;
    /* Top-left sheen and bottom-right subtle reflection */
    background: linear-gradient(135deg,
            rgba(255, 255, 255, 0.18) 0%,
            rgba(255, 255, 255, 0) 45%,
            rgba(255, 255, 255, 0.03) 100%);
    pointer-events: none;
    z-index: 10;
}
</style>