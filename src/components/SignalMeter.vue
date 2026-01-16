<script setup>
import { computed } from 'vue';
const props = defineProps(['tunerValue', 'isScanning', 'active']);

const needleRotation = computed(() => {
  if (!props.active) return -45; // Dead position
  const base = (1 - props.tunerValue) * 90 - 45;
  const jitter = props.isScanning ? (Math.random() - 0.5) * 12 : 0;
  return base + jitter;
});
</script>

<template>
  <div class="meter">
    <svg viewBox="0 0 100 60">
      <path d="M10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#222" stroke-width="8" />
      <path d="M10 50 A 40 40 0 0 1 40 25" fill="none" stroke="#e74c3c" stroke-width="2" />
      <path d="M40 25 A 40 40 0 0 1 90 50" fill="none" stroke="#42b983" stroke-width="2" />

      <text x="50" y="45" text-anchor="middle" font-size="5" fill="#444" font-family="monospace">FIDELITY</text>

      <g
        :style="{ transform: `rotate(${needleRotation}deg)`, transformOrigin: '50px 50px', transition: 'transform 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)' }">
        <line x1="50" y1="50" x2="50" y2="15" stroke="#fff" stroke-width="1.5" />
      </g>
      <circle cx="50" cy="50" r="3" fill="#333" />
    </svg>
  </div>
</template>

<style scoped>
.meter {
  width: 140px;
  background: #111;
  padding: 5px;
  border-radius: 2px;
  border: 1px solid #333;
}
</style>