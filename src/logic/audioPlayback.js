import * as Tone from 'tone';

// --- SYNTH SETUP ---
// A "fat" oscillator simulates the richness of multi-pipe organ stops
const synth = new Tone.PolySynth(Tone.Synth, {
  oscillator: {
    type: "fatsawtooth",
    count: 3,
    spread: 30
  },
  envelope: {
    attack: 0.15,
    decay: 0.3,
    sustain: 1,
    release: 1.2
  }
}).toDestination();

// --- EFFECTS CHAIN ---

// 1. Radio Filter: A Bandpass filter that makes the sound "tinny" like a radio
const radioFilter = new Tone.Filter({
  type: "bandpass",
  frequency: 1200,
  Q: 1.5
}).toDestination();

// 2. Tremolo: The mechanical "shimmer" of an organ (Tremulant)
const tremolo = new Tone.Tremolo({
  frequency: 5.5,
  depth: 0.5
}).toDestination().start();

// 3. Reverb: Simulating a stone cathedral space
const reverb = new Tone.Reverb({
  decay: 4.5,
  wet: 0.45
}).toDestination();

// 4. Noise Floor: The "Radio Static" crackle
const noise = new Tone.Noise("pink").start();
const noiseFilter = new Tone.Filter(1000, "lowpass").toDestination();
const noiseGain = new Tone.Gain(0).toDestination();
noise.chain(noiseFilter, noiseGain);

// Connect Synth to Effects: Synth -> Filter -> Tremolo -> Reverb
synth.chain(radioFilter, tremolo, reverb);

// Lower overall volume to prevent digital clipping
synth.volume.value = -18;

// --- STATE ---
let queuedChord = null;

/**
 * Maps MIDI numbers (e.g., "60-64-67") to Tone.js Note Names
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
 * User interaction required to start Web Audio
 */
export async function startAudioContext() {
  if (Tone.context.state !== 'running') {
    await Tone.start();
    await reverb.generate(); // Pre-warm reverb buffer
    console.log('BroadcastJSB Audio Engine Online');
  }
}

/**
 * Updates the 'buffer' with the chord sampled from the Latent Space
 */
export function setNextLatentChord(chord) {
  queuedChord = chord;
}

/**
 * Controls the "Radio Interference" sound
 * As tunerValue increases, noise floor rises and filter narrows
 */
export function updateNoiseFloor(tunerValue) {
  // Higher tunerValue = more static
  const noiseVolume = tunerValue > 0.4 ? (tunerValue - 0.4) * 0.15 : 0;
  noiseGain.gain.rampTo(noiseVolume, 0.4);

  // Narrow the radio filter as we drift (Q increases)
  const newQ = 1.5 + (tunerValue * 8);
  radioFilter.Q.rampTo(newQ, 0.5);
}

/**
 * The "Rhythmic Tactus": Keeps a steady Bach pulse
 */
export function startRadioTransport() {
  Tone.Transport.bpm.value = 68; // Traditional chorale tempo

  Tone.Transport.scheduleRepeat((time) => {
    if (queuedChord && queuedChord.pitchclass) {
      const notes = midiToNoteNames(queuedChord.pitchclass);
      // Play note slightly longer than the beat for a legato organ feel
      synth.triggerAttackRelease(notes, "2n", time);
    }
  }, "4n"); // Quarter note pulse

  Tone.Transport.start();
}

export function stopRadioTransport() {
  Tone.Transport.stop();
  Tone.Transport.cancel();
  noiseGain.gain.value = 0;
}

/**
 * Gracefully shuts down the radio audio
 */
export function stopRadio() {
  // 1. Fade out the noise floor and synth volume
  noiseGain.gain.rampTo(0, 0.5); // 500ms fade
  synth.volume.rampTo(-100, 0.5); 

  // 2. Stop the transport after the fade
  setTimeout(() => {
    Tone.Transport.stop();
    Tone.Transport.cancel(); // Clear the schedule
    console.log('BroadcastJSB Audio Engine Offline');
  }, 500);
}