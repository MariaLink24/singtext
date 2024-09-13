import * as Tone from "tone";
import  { useState, useRef } from 'react';
import PWABadge from './PWABadge.tsx'

function App() {
  const [value, setValue] = useState('');

  const recorder = new Tone.Recorder();
  const synth = new Tone.PolySynth(Tone.Synth).toDestination().connect(recorder);
  const now = Tone.now();
  const [recordedText, setRecordedText] = useState('');
  const [decodedText, setDecodedText] = useState(''); 


  const [isListening, setIsListening] = useState(false); // Track if the mic is active
  const audioContextRef = useRef<AudioContext | null>(null); // Ref for AudioContext
  const analyserRef = useRef<AnalyserNode | null>(null); // Ref for AnalyserNode
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null); // Ref for MediaStreamSource
  const streamRef = useRef<MediaStream | null>(null); // Ref for the media stream
  const intervalRef = useRef<number | null>(null); // Ref for the interval ID

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
  const C4_frequency = 261.63;  
  const B4_frequency = 493.88;  
  const singString = async (str: string) => {
    const arr = str.split('');
    const notes: string[] = [];

    arr.forEach((el) => {
      //@ts-ignore
      const morseCode = morse[el.toUpperCase()];
      if (morseCode) {
              //@ts-ignore
        morseCode.split('').forEach((e) => {
          notes.push(e === '.' ? "C4" : "B4");
        });
      } 
    });
    console.log('notes', notes)

    await Tone.start();
    for (let i = 0; i < notes.length; i++) {
      synth.triggerAttackRelease(notes[i], "8n", now + i);
    }
  };


  const listenToMusic = async () => {
    if (isListening) return;
  
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyserRef.current = analyser;
  
    const source = audioContext.createMediaStreamSource(stream);
    sourceRef.current = source;
    source.connect(analyser);
  
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
  
    const detectTone = () => {
      analyser.getByteFrequencyData(dataArray);
  
      const getFrequencyFromIndex = (index: number) => index * (audioContext.sampleRate / 2) / bufferLength;
  
      let detectedTone = '';
  
      for (let i = 0; i < bufferLength; i++) {
        const frequency = getFrequencyFromIndex(i);
  
        if (Math.abs(frequency - C4_frequency) < 20) {
          detectedTone = '.'; 
        } else if (Math.abs(frequency - B4_frequency) < 20) {
          detectedTone = '-';
        }
      }
  
    
      if (detectedTone) {
        setRecordedText((prev) => prev + detectedTone);
      }
    };
  
    intervalRef.current = window.setInterval(detectTone, 200);
    setIsListening(true);
  };
  const morseToChar = Object.fromEntries(Object.entries(morse).map(([letter, code]) => [code, letter]));

  const decodeMorse = (morseCode: string) => {
    const words = morseCode.trim().split(' ');  
    const decoded = words.map(word => morseToChar[word] || '?').join('');
    setDecodedText(decoded); 
  };

  const stopListening = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect(); 
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close(); 
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop()); 
      streamRef.current = null;
    }
    setIsListening(false); 
  };

  return (
    <>
      <input value={value} onChange={(e) => setValue(e.target.value)} />
      <button onClick={() => singString(value)}>Sing</button>
      {/* <button onClick={listenToMusic} disabled={isListening}>Listen</button>
      <button onClick={stopListening} disabled={!isListening}>Stop Listening</button>
      <button onClick={ ()=> decodeMorse(recordedText)}>Decode text</button>
      <p>Recorded Text: {recordedText}</p>
      <p>Decoded Text: {decodedText}</p> */}

    </>
  );
}

export default App;
