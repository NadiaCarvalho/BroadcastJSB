<script setup>
import { ref } from 'vue';
const props = defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue']);

const startY = ref(0);
const startVal = ref(0);

function initDrag(e) {
  startY.value = e.clientY;
  startVal.value = props.modelValue;
  window.addEventListener('mousemove', doDrag);
  window.addEventListener('mouseup', endDrag);
}

function doDrag(e) {
  const delta = (startY.value - e.clientY) / 250;
  const next = Math.min(1, Math.max(0, startVal.value + delta));
  emit('update:modelValue', next);
}

function endDrag() {
  window.removeEventListener('mousemove', doDrag);
  window.removeEventListener('mouseup', endDrag);
}
</script>

<template>
  <div class="dial-container">
    <div class="knob" @mousedown="initDrag" :style="{ transform: `rotate(${(modelValue * 270) - 135}deg)` }">
      <div class="marker"></div>
    </div>
    <div class="dial-labels">
      <span>ORIGINAL</span>
      <span>DRIFT</span>
    </div>
  </div>
</template>

<style scoped>
.dial-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.knob {
  width: 80px;
  height: 80px;
  background: radial-gradient(circle, #333, #111);
  border: 4px solid #222;
  border-radius: 50%;
  position: relative;
  cursor: ns-resize;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
}

.marker {
  position: absolute;
  top: 8px;
  left: 50%;
  width: 4px;
  height: 12px;
  background: #42b983;
  transform: translateX(-50%);
}

.dial-labels {
  width: 120px;
  display: flex;
  justify-content: space-between;
  font-size: 0.5rem;
  color: #555;
}
</style>