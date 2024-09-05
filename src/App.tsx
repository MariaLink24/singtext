import * as Tone from "tone";
import React, { useState } from 'react';

function App() {
  const [value, setValue] = useState('');

  const recorder = new Tone.Recorder();
  const synth = new Tone.PolySynth(Tone.Synth).toDestination().connect(recorder);
  const now = Tone.now();

  const morse = {
    'А': '.-',
    'Б': '-...',
    'В': '.--',
    'Г': '--.',
    'Д': '-..',
    'Е': '.',
    'Ж': '...-',
    'З': '--..',
    'И': '..',
    'Й': '.---',
    'К': '-.-',
    'Л': '.-..',
    'М': '--',
    'Н': '-.',
    'О': '---',
    'П': '.--.',
    'Р': '.-.',
    'С': '...',
    'Т': '-',
    'У': '..-',
    'Ф': '..-.',
    'Х': '....',
    'Ц': '-.-.',
    'Ч': '---.',
    'Ш': '----',
    'Щ': '--.-',
    'Ъ': '.--.-.',
    'Ы': '-.--',
    'Ь': '-..-',
    'Э': '..-..',
    'Ю': '..--',
    'Я': '.-.-',
  };

  const initializeAudioContext = async () => {
      const newAudioContext = new window.AudioContext();
      setAudioContext(newAudioContext);

  };

  const singString = async (str: string) => {
    const arr = str.split('');
    const notes: string[] = [];

    arr.forEach((el) => {
      const morseCode = morse[el.toUpperCase()];
      if (morseCode) {
        morseCode.split('').forEach((e) => {
          notes.push(e === '.' ? "C4" : "B4");
        });
      } 
    });

    await Tone.start();
    recorder.start();
    for (let i = 0; i < notes.length; i++) {
      synth.triggerAttackRelease(notes[i], "8n", now + i);
    }

    setTimeout(async () => {
      const recording = await recorder.stop();
      const url = URL.createObjectURL(recording);
      const anchor = document.createElement("a");
      anchor.download = "recording.wav";
      anchor.href = url;
      anchor.click();
    }, 4000);
  };


  return (
    <>
      <input value={value} onChange={(e) => setValue(e.target.value)} />
      <button onClick={() => singString(value)}>Sing</button>
    </>
  );
}

export default App;
