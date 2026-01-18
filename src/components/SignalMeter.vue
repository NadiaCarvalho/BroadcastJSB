<script setup>
import { computed, ref } from 'vue';
import { Broadcaster } from '../logic/broadcaster';

const props = defineProps(['tunerValue', 'isScanning', 'active']);

// Mechanical jitter loop
const internalJitter = ref(0);
setInterval(() => {
  if (props.active && (props.isScanning || props.tunerValue > 0.6)) {
    // Jitter intensity increases as signal fidelity drops
    internalJitter.value = (Math.random() - 0.5) * (props.tunerValue * 12);
  } else {
    internalJitter.value = 0;
  }
}, 50);

const needleRotation = computed(() => {
  if (!props.active) return -60;
  const base = (1 - props.tunerValue) * 90 - 45;
  return base + internalJitter.value;
});

// Calculate how many segments of the signal bar to light up (0 to 5)
const signalBars = computed(() => {
  if (!props.active) return 0;
  // Inverse of tuner: 0 tuner = 5 bars, 1 tuner = 0 bars
  return Math.ceil((1 - props.tunerValue) * 5);
});
</script>

<template>
  <div class="meter-container">
    <div class="unit-label">SIGNAL FIDELITY</div>
    <div :class="['meter', { 'power-off': !active }]">
      <svg viewBox="0 0 100 75">
        <g fill="none" stroke-width="8" stroke-linecap="round">
          
          <path d="M10 50 A 40 40 0 0 1 90 50" stroke="#1a1a1a" />

          <path 
            d="M10 50 A 40 40 0 0 1 90 50" 
            stroke="#8b2e25" 
            stroke-width="3"
            stroke-dasharray="45 200" 
          />
          
          <path 
            d="M10 50 A 40 40 0 0 1 90 50" 
            stroke="#42b983" 
            stroke-width="3"
            stroke-dasharray="85 200"
            stroke-dashoffset="-45"
          />
        </g>

        <text x="50" y="40" text-anchor="middle" font-size="3.5" fill="#444" font-family="monospace">
          {{ isScanning ? 'SEARCHING...' : 'DECODER LOCK' }}
        </text>

        <g class="strength-bar" transform="translate(30, 58)">
          <rect v-for="i in 5" :key="i"
            :x="(i-1) * 8" y="0" 
            width="6" height="3" 
            :fill="i <= signalBars ? (i > 3 ? '#42b983' : '#a68b6d') : '#1a1a1a'"
            :class="{ 'active-bar': i <= signalBars && active }"
          />
          <text x="-2" y="3" text-anchor="end" font-size="3" fill="#333">STR</text>
        </g>

        <g :style="{ 
            transform: `rotate(${needleRotation}deg)`, 
            transformOrigin: '50px 50px', 
            transition: 'transform 0.1s ease-out' 
          }">
          <line 
            x1="50" y1="50" x2="50" y2="15" 
            :class="['needle-line', { 'pulse-glow': Broadcaster.lastSelectionWasOriginal && active }]"
          />
        </g>
        
        <circle cx="50" cy="50" r="3" fill="#050505" stroke="#222" />
      </svg>
      <div class="glass-sheen"></div>
    </div>
  </div>
</template>

<style scoped>
.meter-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.unit-label {
  font-family: 'Courier New', monospace;
  font-size: 0.55rem;
  color: #a68b6d;
  letter-spacing: 1px;
}

.meter {
  width: 140px;
  background: #080808;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #2a1d15;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 0 20px #000;
}

.power-off {
  filter: grayscale(1) brightness(0.3);
}

.needle-line {
  stroke: #555;
  stroke-width: 1.5;
  transition: stroke 0.1s;
}

/* THE SIGNAL LOCK PULSE */
.pulse-glow {
  stroke: #42b983 !important;
  stroke-width: 2.5 !important;
  filter: drop-shadow(0 0 2px #42b983);
}

.active-bar {
  filter: drop-shadow(0 0 1px currentColor);
}

.glass-sheen {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%);
  pointer-events: none;
}
</style>