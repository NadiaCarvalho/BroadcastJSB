import * as Tone from 'tone';
import { Broadcaster } from './Broadcaster';

// --- SYNTH SETUP ---
// Organ-style synth using multiple oscillators for a rich, "church-like" sound
const synth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "fatsawtooth", count: 3, spread: 30 },
  envelope: { attack: 0.15, decay: 0.3, sustain: 1, release: 1.2 }
}).toDestination();

// --- EFFECTS CHAIN ---

// 1. Radio Filter (Bandpass) - simulating the frequency response of a radio
const radioFilter = new Tone.Filter({
  type: "bandpass",
  frequency: 1200,
  Q: 1.5
}).toDestination();

// 2. Tremolo (The organ's 'tremulant' mechanical shimmer)
const tremolo = new Tone.Tremolo({
  frequency: 5.5,
  depth: 0.5
}).toDestination().start();

// 3. Reverb (Adding spatial depth)
const reverb = new Tone.Reverb({
  decay: 4.5,
  wet: 0.45
}).toDestination();

// 4. Noise Floor (Static/Interference)
const noise = new Tone.Noise("pink");
const noiseFilter = new Tone.Filter(1000, "lowpass");
const noiseGain = new Tone.Gain(0).toDestination();

// Chain everything together
synth.chain(radioFilter, tremolo, reverb);
noise.chain(noiseFilter, noiseGain);

// Initial Volume Settings
synth.volume.value = -18;

// Add a Meter node at the end of the chain
const meter = new Tone.Meter();
synth.connect(meter); // Connect the synth to the meter

// --- STATE ---
let queuedChord = null;

/**
 * Maps MIDI numbers from the JSON (e.g., "36-48-54-64-69") to Tone.js Notes
 */
function midiToNoteNames(pitchclassString) {
  if (!pitchclassString) return [];
  const midiNotes = pitchclassString.split('-').map(Number);
  const PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  return midiNotes.map(midi => {
    const noteName = PITCH_CLASSES[midi % 12];
    const octave = Math.floor(midi / 12) - 1;
    return `${noteName}${octave}`;
  });
}

/**
 * User interaction starts the audio engine
 */
export async function startAudioContext() {
  if (Tone.context.state !== 'running') {
    await Tone.start();
    await reverb.generate();
    noise.start();
    console.log('BroadcastJSB: Engine Online');
  }
}

/**
 * Receives the drifted chord from Broadcaster.js
 */
export function setNextLatentChord(chord) {
  queuedChord = chord;
}

/**
 * Handles the "Radio" soundscape
 * @param {Number} tunerValue - Knob 0.0 to 1.0
 * @param {Boolean} isBetweenStations - Whether we are in the transition pause
 */
export function handleInterstationNoise(tunerValue, isBetweenStations) {
  let volume = 0;
  let targetQ = 1.5 + (tunerValue * 8);

  if (isBetweenStations) {
    // Max static and thin filter during search
    volume = 0.2; 
    targetQ = 15;
  } else {
    // Static rises as we drift away from 0.0
    volume = tunerValue > 0.4 ? (tunerValue - 0.4) * 0.15 : 0;
  }

  noiseGain.gain.rampTo(volume, 0.4);
  radioFilter.Q.rampTo(targetQ, 0.4);
}

/**
 * Dynamics Update (convenience wrapper for tuner watch)
 */
export function updateNoiseFloor(tunerValue) {
  handleInterstationNoise(tunerValue, Broadcaster.isBetweenStations);
}

/**
 * THE TACTUS (Heartbeat of the installation)
 */
export function startRadioTransport() {
  // Reset synth volume
  synth.volume.setValueAtTime(-18, Tone.now());
  
  // Bach Chorale Tempo
  Tone.Transport.bpm.value = 68;

  // This loop triggers every quarter note (the beat)
  Tone.Transport.scheduleRepeat((time) => {
    // 1. Tell Broadcaster to check sequence and find next chord
    Broadcaster.nextStep();

    // 2. Play the chord if we are not between stations
    if (!Broadcaster.isBetweenStations && queuedChord && queuedChord.pitchclass) {
      const notes = midiToNoteNames(queuedChord.pitchclass);
      
      // Determine rhythm from current phrase or default to 4n
      const rhythm = Broadcaster.currentPhrase?.rhythms[Broadcaster.stepIndex] || "4n";
      
      synth.triggerAttackRelease(notes, rhythm, time);
    }
  }, "4n");

  Tone.Transport.start();
}

/**
 * STOP: Aggressive kill-switch for Power Off
 */
export function stopRadio() {
  Tone.Transport.stop();
  Tone.Transport.cancel(0);

  const now = Tone.now();
  noiseGain.gain.setValueAtTime(0, now);
  synth.releaseAll();
  synth.volume.setValueAtTime(-100, now);

  queuedChord = null;
  console.log('BroadcastJSB: Signal Cut');
}

/**
 * Updates the master volume
 * @param {Number} val - 0.0 to 1.0
 */
export function setMasterVolume(val) {
  // Map 0-1 to -60dB (silent) to 0dB (loud)
  // We use Tone.dbToGain and back or a simple linear-to-log mapping
  const db = val === 0 ? -100 : Tone.gainToDb(val);
  synth.volume.rampTo(db, 0.1);
}

/**
 * Gets the current peak volume in a 0-1 range for the UI
 */
export function getLevel() {
  // Get the decibel level and convert to a 0-1 normalized value
  const db = meter.getValue();
  // Map -60dB (silence) to 0dB (loud) into 0.0 to 1.0
  const level = Math.pow(10, db / 20); 
  return Math.min(Math.max(level, 0), 1);
}