<script setup>
import { ref, computed } from 'vue';
const props = defineProps({
  modelValue: { type: Number, default: 0 },
  size: { type: Number, default: 80 },
  labels: { type: Array, default: () => ['ORIGINAL', 'DRIFT'] } // e.g., ['MIN', 'MAX']
});
const emit = defineEmits(['update:modelValue']);

const startY = ref(0);
const startVal = ref(0);

const labelWidth = computed(() => props.size > 100 ? props.size * .97 : props.size * 1.4);

function initDrag(e) {
  startY.value = e.clientY;
  startVal.value = props.modelValue;
  window.addEventListener('mousemove', doDrag);
  window.addEventListener('mouseup', endDrag);
}

function doDrag(e) {
  // Sensitivity adjusted for size: larger knobs feel "heavier"
  const sensitivity = props.size > 80 ? 250 : 150;
  const delta = (startY.value - e.clientY) / sensitivity;
  const next = Math.min(1, Math.max(0, startVal.value + delta));
  emit('update:modelValue', next);
}

function endDrag() {
  window.removeEventListener('mousemove', doDrag);
  window.removeEventListener('mouseup', endDrag);
}
</script>

<template>
  <div class="dial-container" :style="{ width: size + 'px' }">
    <div class="knob" @mousedown="initDrag" :style="{
    width: size + 'px',
    height: size + 'px',
    transform: `rotate(${(modelValue * 270) - 135}deg)`
  }">
      <div class="marker" :style="{ height: (size * 0.15) + 'px' }"></div>
    </div>
    <div class="dial-labels" :style="{ width: labelWidth + 'px' }">
      <span>{{ labels[0] }}</span>
      <span>{{ labels[1] }}</span>
    </div>
  </div>
</template>

<style scoped>
.dial-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  user-select: none;
}

.knob {
  background: radial-gradient(circle at 30% 30%, #444, #111);
  border: 3px solid #222;
  border-radius: 50%;
  position: relative;
  cursor: ns-resize;
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.5),
    inset 0 2px 2px rgba(255, 255, 255, 0.1);
}

/* Hover glow effect */
.knob:hover {
  box-shadow: 0 0 12px rgba(166, 139, 109, 0.3), 0 4px 8px rgba(0,0,0,0.5);
}

.marker {
  position: absolute;
  top: 10%;
  left: 50%;
  width: 3px;
  background: #ff4d00;
  transform: translateX(-50%);
  border-radius: 2px;
  box-shadow: 0 0 4px rgba(255, 77, 0, 0.6);
}

.dial-labels {
  display: flex;
  justify-content: space-between;
  font-family: 'Courier New', monospace;
  font-size: 0.55rem;
  color: #8b7355;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: bold;
  pointer-events: none;
}
</style>