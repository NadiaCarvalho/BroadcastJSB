<script setup>
import * as Tone from 'tone';

const props = defineProps({
    modelValue: Boolean
});
const emit = defineEmits(['update:modelValue']);

function toggle() {
    // Mechanical click sound effect
    const click = new Tone.NoiseSynth({
        noise: { type: 'pink' },
        envelope: { attack: 0.001, decay: 0.01, sustain: 0 }
    }).toDestination();
    click.triggerAttackRelease("16n");

    emit('update:modelValue', !props.modelValue);
}
</script>

<template>
    <div class="switch-outer">
        <div class="label">POWER</div>
        <div :class="['switch-base', { 'is-on': modelValue }]" @click="toggle">
            <div class="toggle-handle"></div>
        </div>
    </div>
</template>

<style scoped>
.switch-outer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

.label {
    font-size: 0.6rem;
    color: #666;
    font-weight: bold;
    letter-spacing: 1px;
}

.switch-base {
    width: 40px;
    height: 60px;
    background: #1a1a1a;
    border-radius: 4px;
    position: relative;
    cursor: pointer;
    border: 2px solid #333;
    transition: background 0.3s;
}

.toggle-handle {
    width: 24px;
    height: 24px;
    background: linear-gradient(to bottom, #444, #222);
    border: 1px solid #000;
    position: absolute;
    left: 6px;
    bottom: 6px;
    transition: transform 0.1s cubic-bezier(0.45, 0, 0.55, 1);
    border-radius: 2px;
}

.is-on .toggle-handle {
    transform: translateY(-24px);
    background: linear-gradient(to bottom, #555, #333);
}

.is-on {
    background: #222;
    border-color: #42b983;
}
</style>