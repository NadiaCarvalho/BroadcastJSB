<script setup>
import { ref, watch, isRef, computed } from 'vue';

// --- IMPORTS ---

import { substitutePhrase, setChordDict, getChordById } from './../logic/latentStrategies.js';
import { playPhrase, stopPlayback, startAudioContext } from './../logic/audioPlayback.js';

// --- DATA & DICTIONARY SETUP ---
import latentJson from './../data/chords_bach_all.json';
const chordDict = latentJson.chords;
setChordDict(chordDict);

import demoPhrases from '../data/phrases.json';

// Strategy controls state
const strategy = ref('knn');
const k = ref(5);

</script>

<template>
      <div id="app" class="app-container">
        <h1>BroadcastJSB</h1>
      </div>
</template>

<style>
/* Basic styles */
.app-container {
  /*max-width: 1200px;*/
  margin: 0 auto;
  padding: 20px;
  font-family: sans-serif;
}

.control-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.audio-controls button {
  padding: 8px 12px;
  margin-left: 10px;
  cursor: pointer;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #fff;
  transition: background-color 0.2s;
}

.audio-controls button:hover {
  background-color: #eee;
}
</style>