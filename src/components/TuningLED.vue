<script setup>
import { computed } from 'vue';
const props = defineProps(['tunerValue', 'active']);

const glow = computed(() => {
  if (!props.active) return 0;
  // Intensity drops as we move away from 0 (Bach)
  return Math.max(0, 1 - props.tunerValue * 1.5);
});
</script>

<template>
  <div class="led-wrapper">
    <div class="led-bulb" :style="{
      backgroundColor: `rgba(66, 185, 131, ${0.1 + glow * 0.9})`,
      boxShadow: `0 0 ${glow * 15}px #42b983`,
      opacity: active ? 1 : 0.2
    }"></div>
    <div class="led-text">TUNING</div>
  </div>
</template>

<style scoped>
.led-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.led-bulb {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid #333;
  transition: all 0.2s;
}

.led-text {
  font-size: 0.5rem;
  color: #555;
  font-weight: bold;
}
</style>