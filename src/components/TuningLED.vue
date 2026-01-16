<script setup>
import { computed } from 'vue';

const props = defineProps({
  tunerValue: { type: Number, default: 0 } // 0.0 (Bach) to 1.0 (Latent)
});

// The light is brightest when tunerValue is 0 (Original Bach)
const glowIntensity = computed(() => {
  const intensity = Math.max(0, 1 - props.tunerValue * 1.5);
  return intensity;
});

const ledStyle = computed(() => ({
  backgroundColor: `rgba(66, 185, 131, ${0.2 + glowIntensity.value * 0.8})`,
  boxShadow: `0 0 ${glowIntensity.value * 15}px #42b983`,
  border: `1px solid rgba(66, 185, 131, ${0.3 + glowIntensity.value * 0.4})`
}));
</script>

<template>
  <div class="led-container">
    <div class="led-bulb" :style="ledStyle"></div>
    <span class="led-label">TUNING</span>
  </div>
</template>

<style scoped>
.led-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}
.led-bulb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transition: all 0.3s ease;
}
.led-label {
  font-family: 'Courier New', monospace;
  font-size: 0.6rem;
  color: #888;
  font-weight: bold;
}
</style>