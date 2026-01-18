<template>
    <div class="strategy-column" :class="{ 'power-off': disabled }">
        <button v-for="opt in ['knn', 'linear', 'angular']" :key="opt"
            :class="{ active: Broadcaster.selectedStrategy === opt }" @click="updateStrategy(opt)" class="toggle-btn">
            <div class="indicator-light"></div>
            <span class="label">{{ opt === 'knn' ? 'NEAR' : opt.toUpperCase() }}</span>
        </button>
    </div>
</template>

<script setup>
import { Broadcaster } from '../logic/broadcaster';

const props = defineProps({
    disabled: Boolean
});

const updateStrategy = (mode) => {
    console.log("Switching Strategy to:", mode);
    Broadcaster.selectedStrategy = mode;

    // Force the Broadcaster to recalculate the substitution for 
    // the chord currently being held.
    if (Broadcaster.isReady) {
        Broadcaster.generateDriftChord();
    }
};
</script>

<style scoped>
/* (Keep your existing styles from the previous message) */
.strategy-column {
    display: flex;
    flex-direction: column;
    gap: 6px;
    background: #0f0f0f;
    padding: 8px;
    border: 1px solid #3a2a1d;
    border-radius: 4px;
}

.toggle-btn {
    background: #1a1a1a;
    border: 1px solid #333;
    padding: 6px 10px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 12px;
    cursor: pointer;
    min-width: 90px;
    transition: all 0.2s;
}

.indicator-light {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #111;
    border: 1px solid #000;
    transition: all 0.3s;
}

.toggle-btn.active .indicator-light {
    background: #ff4d00;
    box-shadow: 0 0 8px #ff4d00;
}

.label {
    font-family: 'Courier New', monospace;
    font-size: 0.55rem;
    color: #666;
    letter-spacing: 1px;
}

.toggle-btn.active .label {
    color: #a68b6d;
    font-weight: bold;
}

.toggle-btn:hover {
    background: #222;
}

.strategy-column.power-off {
    border-color: #222;
    background: #050505;
}

/* Force the indicator light to black when disabled */
.power-off .indicator-light {
    background: #000 !important;
    box-shadow: none !important;
    border-color: #111 !important;
}

/* Dim the labels when disabled */
.power-off .label {
    color: #333 !important;
}

/* Prevent hover effects when off */
.power-off .toggle-btn {
    cursor: default;
    background: #0a0a0a !important;
}
</style>../logic/broadcaster