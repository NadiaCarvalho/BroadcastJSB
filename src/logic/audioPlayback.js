import * as Tone from 'tone';
import { Broadcaster } from './Broadcaster';

// --- SYNTH SETUP (Less Buzz, More "Pipe") ---
const synth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { 
    type: "square", // Square waves are less "buzzy" than saw waves
  },
  envelope: { 
    attack: 0.1,    // Slower attack removes the "click"
    decay: 0.2, 
    sustain: 1, 
    release: 0.6 
  }
}).toDestination();

// Secondary filter to specifically remove the "buzzing" high frequencies
const lowPass = new Tone.Filter({
  frequency: 1500, // Cuts the harsh highs
  type: "lowpass",
  rolloff: -24
}).toDestination();

const radioFilter = new Tone.Filter(1200, "bandpass").toDestination();
const reverb = new Tone.Reverb({ decay: 4, wet: 0.4 }).toDestination();
const meter = new Tone.Meter();
const noiseGain = new Tone.Gain(0).toDestination();
const noise = new Tone.Noise("pink").connect(noiseGain).start();

// Final Chain
synth.chain(lowPass, radioFilter, reverb, meter);

let currentDriftedChord = null;
let playbackTimeout = null;
let voiceState = {}; 

export function setNextLatentChord(chord) {
  currentDriftedChord = chord;
}

export function setMasterVolume(val) {
  const db = val === 0 ? -100 : Tone.gainToDb(val);
  synth.volume.rampTo(db, 0.1);
}

export function updateNoiseFloor(tunerValue) {
  const vol = Broadcaster.isBetweenStations ? 0.25 : (tunerValue > 0.4 ? (tunerValue - 0.4) * 0.2 : 0);
  noiseGain.gain.rampTo(vol, 0.2);
}

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
  const bpm = Tone.Transport.bpm.value || 60;
  const now = Tone.now();

  // Voice Management with Humanization
  for (let i = 0; i < 4; i++) {
    const currentNote = voiceState[i];
    const targetNote = targetVoices[i];

    if (currentNote && (!targetNote || currentNote !== targetNote)) {
      // Release old note
      synth.triggerRelease(currentNote, now);
      delete voiceState[i];
    } 
    
    if (targetNote && targetNote !== currentNote) {
      // Humanize: delay the attack by 5ms to 25ms
      const humanOffset = Math.random() * 0.02; 
      synth.triggerAttack(targetNote, now + humanOffset);
      voiceState[i] = targetNote;
    }
  }

  const durationMs = (step.duration * (60 / bpm)) * 1000;
  playbackTimeout = setTimeout(playNextSlice, durationMs);
}

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