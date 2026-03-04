import * as Tone from 'tone';
import { Broadcaster } from './broadcaster';

// --- BPM & DRIFT SETUP ---
const BASE_BPM = 72;
let driftInterval = null;

// --- 1. THE MASTERING CHAIN ---
// Limiter: The absolute ceiling (prevents digital clipping)
const limiter = new Tone.Limiter(-1).toDestination();

// Compressor: "Glues" the sound, making it feel like a professional broadcast
const compressor = new Tone.Compressor({
  threshold: -24, // Starts compressing early
  ratio: 4,       // Firm compression
  attack: 0.03,   // Quick enough to catch peaks
  release: 0.25   // Smooth release
}).connect(limiter);

const masterGain = new Tone.Gain(1).connect(compressor);

// --- 2. SYNTH SETUP ---
const synth = new Tone.PolySynth(Tone.Synth, {
  oscillator: {
    type: "triangle",
    width: .05
  },
  envelope: {
    attack: 0.15,
    decay: 0.2,
    sustain: 1,
    release: 0.8
  },
  volume: -15 // Extra headroom for the compressor to work with
}).connect(masterGain);

// --- 3. FILTERING & EFFECTS ---
const lowPass = new Tone.Filter({
  frequency: 850,
  type: "lowpass",
  rolloff: -48
});

const radioFilter = new Tone.Filter({
  frequency: 1200,
  type: "bandpass",
  Q: 1.5
});

const reverb = new Tone.Reverb({ decay: 5, wet: 0.35 });
const meter = new Tone.Meter();

const noiseGain = new Tone.Gain(0);
const noiseFilter = new Tone.Filter(350, "lowpass");
const noise = new Tone.Noise("pink").start();

// Final Routing
// Synth -> Filters -> Reverb -> Meter -> MasterBus (Comp -> Limiter)
synth.chain(lowPass, radioFilter, reverb, meter, masterGain);
noise.chain(noiseFilter, noiseGain, masterGain);

let currentDriftedChord = null;
let playbackTimeout = null;
let voiceState = {};

// --- 4. EXPORTS ---

export function setNextLatentChord(chord) {
  currentDriftedChord = chord;
}

export function setMasterVolume(val) {
  masterGain.gain.rampTo(val, 0.1);
}

export function updateNoiseFloor(tunerValue) {
  const vol = Broadcaster.isBetweenStations
    ? 0.22
    : (tunerValue > 0.4 ? (tunerValue - 0.4) * 0.15 : 0);
  noiseGain.gain.rampTo(vol, 0.2);

  const driftIntensity = Broadcaster.tunerValue * 5; // More drift at higher tuner values
  const newBpm = BASE_BPM + (Math.random() - 0.5) * driftIntensity;
  Tone.getTransport().bpm.rampTo(newBpm, 1);
}

export function handleInterstationNoise(tunerValue, isBetweenStations) {
  updateNoiseFloor(tunerValue);
}

// --- 5. ENGINE LOGIC ---

function getSliceNotes(indices) {
  if (!currentDriftedChord || !currentDriftedChord.pitchclass) return {};
  const pitches = currentDriftedChord.pitchclass.split('-').map(Number).sort((a, b) => a - b);
  const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  const state = {};
  indices.forEach(idx => {
    const midi = pitches[idx] ?? pitches[pitches.length - 1];
    state[idx] = `${NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
  });
  return state;
}

function playNextSlice() {
  if (playbackTimeout) clearTimeout(playbackTimeout);

  const step = Broadcaster.nextStep();
  if (!step) {
    playbackTimeout = setTimeout(playNextSlice, 500);
    return;
  }

  const targetVoices = getSliceNotes(step.all_indices);
  const now = Tone.now();

  for (let i = 0; i < 4; i++) {
    const currentNote = voiceState[i];
    const targetNote = targetVoices[i];

    if (currentNote && (!targetNote || currentNote !== targetNote)) {
      synth.triggerRelease(currentNote, now);
      delete voiceState[i];
    }

    if (targetNote && targetNote !== currentNote) {
      const humanOffset = Math.random() * 0.03;
      synth.triggerAttack(targetNote, now + humanOffset);
      voiceState[i] = targetNote;
    }
  }

  const bpm = Tone.getTransport().bpm.value || BASE_BPM;
  const durationMs = (step.duration * (60 / bpm)) * 1000;
  playbackTimeout = setTimeout(playNextSlice, durationMs);
}



/**
 * Initializes the BPM and starts the subtle "Wow" drift
 */
function startBpmDrift() {
  Tone.getTransport().bpm.value = BASE_BPM;

  // Periodically nudge the BPM every 2-4 seconds
  driftInterval = setInterval(() => {
    // Randomly shift BPM by +/- 1.5
    const drift = (Math.random() - 0.5) * 3;
    const newBpm = BASE_BPM + drift;

    // Ramp to the new BPM smoothly over 2 seconds so it's not a jump
    Tone.getTransport().bpm.rampTo(newBpm, 2);
  }, 3000);
}

// --- 6. LIFECYCLE ---

export async function startAudioContext() {
  if (Tone.getContext().state !== 'running') {
    await Tone.start();
    if (reverb.ready) await reverb.ready;
  }
}

export function startRadioTransport() {
  if (playbackTimeout) clearTimeout(playbackTimeout);

  startBpmDrift();

  voiceState = {};
  synth.releaseAll();
  masterGain.gain.rampTo(1, 0.5);
  playNextSlice();
}

export function stopRadio() {
  const fadeTime = 0.4;
  masterGain.gain.rampTo(0, fadeTime);

  // Clear the drift interval
  if (driftInterval) clearInterval(driftInterval);

  setTimeout(() => {
    if (playbackTimeout) clearTimeout(playbackTimeout);
    synth.releaseAll();
    voiceState = {};
    noiseGain.gain.setValueAtTime(0, Tone.now());
  }, fadeTime * 1000);
}

export function getLevel() {
  const db = meter.getValue();
  return Math.min(Math.max(Math.pow(10, db / 20), 0), 1);
}