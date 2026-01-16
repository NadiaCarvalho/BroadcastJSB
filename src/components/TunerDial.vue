<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: { type: Number, default: 0.5 } // 0.0 to 1.0
});
const emit = defineEmits(['update:modelValue']);

const isDragging = ref(false);
const startY = ref(0);
const startValue = ref(0);

function startDrag(e) {
  isDragging.value = true;
  startY.value = e.clientY;
  startValue.value = props.modelValue;
  window.addEventListener('mousemove', onDrag);
  window.addEventListener('mouseup', stopDrag);
}

function onDrag(e) {
  if (!isDragging.value) return;
  const delta = (startY.value - e.clientY) / 200; // Sensitivity
  const newValue = Math.min(1, Math.max(0, startValue.value + delta));
  emit('update:modelValue', newValue);
}

function stopDrag() {
  isDragging.value = false;
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('mouseup', stopDrag);
}
</script>

<template>
  <div class="tuner-container">
    <div 
      class="knob" 
      :style="{ transform: `rotate(${(modelValue * 270) - 135}deg)` }"
      @mousedown="startDrag"
    >
      <div class="indicator"></div>
    </div>
    <div class="frequency-display">
      <span class="unit">LATENT MHZ</span>
      <span class="value">{{ (88 + (modelValue * 20)).toFixed(1) }}</span>
    </div>
  </div>
</template>

<style scoped>
.tuner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #222;
  padding: 20px;
  border-radius: 50%;
  width: 180px;
  height: 180px;
  border: 4px solid #444;
}

.knob {
  width: 100px;
  height: 100px;
  background: linear-gradient(145deg, #333, #111);
  border-radius: 50%;
  position: relative;
  cursor: grab;
  box-shadow: 0 5px 15px rgba(0,0,0,0.5);
}

.knob:active { cursor: grabbing; }

.indicator {
  position: absolute;
  top: 10px;
  left: 50%;
  width: 4px;
  height: 15px;
  background: #42b983;
  transform: translateX(-50%);
}

.frequency-display {
  margin-top: 15px;
  color: #42b983;
  font-family: 'Courier New', Courier, monospace;
  text-align: center;
}

.value { font-size: 1.5rem; display: block; font-weight: bold; }
.unit { font-size: 0.6rem; opacity: 0.7; }
</style>