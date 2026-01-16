import * as Tone from 'tone';

// --- SYNTH SETUP ---
const synth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "fatsawtooth", count: 3, spread: 30 },
  envelope: { attack: 0.15, decay: 0.3, sustain: 1, release: 1.2 }
}).toDestination();

// --- EFFECTS CHAIN ---

// 1. Radio Filter (Bandpass)
const radioFilter = new Tone.Filter({
  type: "bandpass",
  frequency: 1200,
  Q: 1.5
}).toDestination();

// 2. Tremolo (Organ Tremulant)
const tremolo = new Tone.Tremolo({
  frequency: 5.5,
  depth: 0.5
}).toDestination().start();

// 3. Reverb (Cathedral Space)
const reverb = new Tone.Reverb({
  decay: 4.5,
  wet: 0.45
}).toDestination();

// 4. Noise Floor (Radio Static)
const noise = new Tone.Noise("pink");
const noiseFilter = new Tone.Filter(1000, "lowpass");
const noiseGain = new Tone.Gain(0).toDestination();

// Connect Synth and Noise
synth.chain(radioFilter, tremolo, reverb);
noise.chain(noiseFilter, noiseGain);

// Lower volume to prevent clipping
synth.volume.value = -18;

// --- STATE ---
let queuedChord = null;

/**
 * MIDI to Tone.js Note Name conversion
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
 * Start Audio Context
 */
export async function startAudioContext() {
  if (Tone.context.state !== 'running') {
    await Tone.start();
    await reverb.generate();
    noise.start(); // Start the noise generator source
    console.log('Audio Context Started');
  }
}

/**
 * Update the chord to be played on the next beat
 */
export function setNextLatentChord(chord) {
  queuedChord = chord;
}

/**
 * Dynamics: Static and Filter Narrowing
 */
export function updateNoiseFloor(tunerValue) {
  if (Tone.Transport.state !== 'running') return;
  
  const noiseVolume = tunerValue > 0.4 ? (tunerValue - 0.4) * 0.15 : 0;
  noiseGain.gain.rampTo(noiseVolume, 0.4);

  const newQ = 1.5 + (tunerValue * 8);
  radioFilter.Q.rampTo(newQ, 0.5);
}

/**
 * Starts the Bach "Tactus"
 */
export function startRadioTransport() {
  // Ensure volume is reset if it was previously killed
  synth.volume.setValueAtTime(-18, Tone.now());
  
  Tone.Transport.bpm.value = 68;

  // Schedule the repeating pulse
  Tone.Transport.scheduleRepeat((time) => {
    if (queuedChord && queuedChord.pitchclass) {
      const notes = midiToNoteNames(queuedChord.pitchclass);
      synth.triggerAttackRelease(notes, "2n", time);
    }
  }, "4n");

  Tone.Transport.start();
}

/**
 * POWER OFF: Aggressive Silence
 */
export function stopRadio() {
  // 1. Kill the Transport immediately
  Tone.Transport.stop();
  Tone.Transport.cancel(0); // This clears the scheduled repeats

  // 2. Kill the Audio Nodes
  const now = Tone.now();
  noiseGain.gain.cancelScheduledValues(now);
  noiseGain.gain.setValueAtTime(0, now);
  
  synth.releaseAll(); // Stop any currently ringing notes
  synth.volume.cancelScheduledValues(now);
  synth.volume.setValueAtTime(-100, now); // Absolute silence

  queuedChord = null;
  console.log('Radio Power Off: Signal Terminated');
}