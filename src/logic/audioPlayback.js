import * as Tone from 'tone';
import { Broadcaster } from './Broadcaster';

// --- SYNTH SETUP (Pipe Organ / Flute Style) ---
const synth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "square" },
  envelope: { attack: 0.1, decay: 0.2, sustain: 1, release: 0.6 }
}).toDestination();

const lowPass = new Tone.Filter(1500, "lowpass").toDestination();
const radioFilter = new Tone.Filter(1200, "bandpass").toDestination();
const reverb = new Tone.Reverb({ decay: 4, wet: 0.4 }).toDestination();
const meter = new Tone.Meter();

// --- NOISE SETUP (Interstation Static) ---
const noiseGain = new Tone.Gain(0).toDestination();
const noise = new Tone.Noise("pink").connect(noiseGain).start();

// Audio Chain
synth.chain(lowPass, radioFilter, reverb, meter);

let currentDriftedChord = null;
let playbackTimeout = null;
let voiceState = {};

// --- EXPORTS ---

/**
 * Specifically handles the volume of the pink noise static.
 * @param {number} tunerValue - 0.0 to 1.0
 * @param {boolean} isBetweenStations - From Broadcaster state
 */
export function handleInterstationNoise(tunerValue, isBetweenStations) {
  let vol = 0;

  if (isBetweenStations) {
    // Solid static while "scanning"
    vol = 0.25;
  } else {
    // Static increases as the signal "drifts" from 0
    // At 0.0 (Pure Bach), static is 0.
    vol = tunerValue > 0.3 ? (tunerValue - 0.3) * 0.3 : 0;
  }

  noiseGain.gain.rampTo(vol, 0.2);
}

/**
 * External bridge for UI components to trigger noise updates
 */
export function updateNoiseFloor(tunerValue) {
  handleInterstationNoise(tunerValue, Broadcaster.isBetweenStations);
}

export function setNextLatentChord(chord) {
  currentDriftedChord = chord;
}

export function setMasterVolume(val) {
  const db = val === 0 ? -100 : Tone.gainToDb(val);
  synth.volume.rampTo(db, 0.1);
}

// --- ENGINE LOGIC ---

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
      const humanOffset = Math.random() * 0.02;
      synth.triggerAttack(targetNote, now + humanOffset);
      voiceState[i] = targetNote;
    }
  }

  const bpm = Tone.Transport.bpm.value || 60;
  const durationMs = (step.duration * (60 / bpm)) * 1000;
  playbackTimeout = setTimeout(playNextSlice, durationMs);
}

// --- LIFECYCLE ---

export async function startAudioContext() {
  if (Tone.context.state !== 'running') {
    await Tone.start();
    await reverb.generate();
  }
}

export function startRadioTransport() {
  if (playbackTimeout) clearTimeout(playbackTimeout);
  playNextSlice();
}

export function stopRadio() {
  if (playbackTimeout) clearTimeout(playbackTimeout);
  synth.releaseAll();
  voiceState = {};
  noiseGain.gain.setValueAtTime(0, Tone.now());
}

export function getLevel() {
  const db = meter.getValue();
  return Math.min(Math.max(Math.pow(10, db / 20), 0), 1);
}