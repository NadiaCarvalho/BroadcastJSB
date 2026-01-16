<script setup>
import Tuner from './views/Tuner.vue'
</script>

<template>
  <div id="app" class="app-container">
    <Tuner></Tuner>
  </div>
</template>

<style>
html,
body {
  height: 100%;
  margin: 0;

  background-color: black;
}

/* Basic styles */
.app-container {
  width: 100%;
  height: 100%;

  font-family: sans-serif;
  color:#ccc;

  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  align-content: space-around;
  justify-content: space-around;
  align-items: center;
}
</style>