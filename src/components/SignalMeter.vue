<script setup>
import { computed } from 'vue';
const props = defineProps(['tunerValue', 'isScanning']);

const needleRotation = computed(() => {
  const base = (1 - props.tunerValue) * 90 - 45;
  const jitter = props.isScanning ? (Math.random() - 0.5) * 10 : 0;
  return base + jitter;
});
</script>

<template>
  <div class="meter-box">
    <div class="meter-label">SIGNAL FIDELITY</div>
    <svg viewBox="0 0 100 60">
      <path d="M10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#333" stroke-width="6" />
      <path d="M70 20 A 40 40 0 0 1 90 50" fill="none" stroke="#42b983" stroke-width="2" />
      <line x1="50" y1="50" x2="50" y2="15" stroke="white" stroke-width="2"
        :style="{ transform: `rotate(${needleRotation}deg)`, transformOrigin: '50px 50px' }" />
    </svg>
  </div>
</template>

<style scoped>
.meter-box {
  background: #1a1a1a;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #333;
}

.meter-label {
  color: #888;
  font-size: 0.6rem;
  font-family: monospace;
}
</style>