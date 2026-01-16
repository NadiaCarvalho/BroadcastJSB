import * as Tone from 'tone';

// Organ Synth
const synth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "fatsawtooth", count: 3, spread: 30 },
  envelope: { attack: 0.1, sustain: 1, release: 0.8 }
}).toDestination();

// Effects Chain
const radioFilter = new Tone.Filter({ type: "bandpass", frequency: 1000, Q: 1 }).toDestination();
const tremolo = new Tone.Tremolo(5, 0.4).start().toDestination();
const reverb = new Tone.Reverb({ decay: 4, wet: 0.4 }).toDestination();

synth.chain(radioFilter, tremolo, reverb);

let queuedChord = null;

export function setNextLatentChord(chord) {
  queuedChord = chord;
}

export function startRadioTransport() {
  Tone.Transport.scheduleRepeat((time) => {
    if (queuedChord) {
      // Logic to convert MIDI to Note Names here
      const notes = queuedChord.pitchclass.split('-').map(n => Tone.Frequency(Number(n), "midi").toNote());
      synth.triggerAttackRelease(notes, "2n", time);
    }
  }, "4n");
  Tone.Transport.start();
}

export async function startAudioContext() {
  if (Tone.getContext().state !== 'running') {
    // Check if the context is suspended and start it
    await Tone.start();
    console.log('Tone.js audio context started.');
  }
}