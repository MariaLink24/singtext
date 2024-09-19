import React, { useState } from 'react';

const App = () => {
  const [value, setValue] = useState('');
  const [decodedText, setDecodedText] = useState('');

  const C4_frequency = 261.63;  
  const B4_frequency = 493.88;  

  const convertTextToBinary = (text: string) => {
    return text
      .split('')
      .map(char => char.charCodeAt(0).toString(2).padStart(8, '0')) 
      .join('');
  };

  const convertBinaryToNotes = (binary: string) => {
    const notesList = [];
    for (let i = 0; i < binary.length; i++) {
      const bit = binary[i];
      notesList.push(bit === '0' ? 'B4' : 'C4'); 
    }
    return notesList;
  };


  const singString = () => {
    const binarySequence = convertTextToBinary(value);
    const notesToPlay = convertBinaryToNotes(binarySequence);
console.log('value', value)
console.log('binarySequence', binarySequence)
console.log('notesToPlay', notesToPlay)

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let time = audioCtx.currentTime;

    notesToPlay.forEach(note => {
      const oscillator = audioCtx.createOscillator();
      oscillator.frequency.setValueAtTime(notes[note], time);
      oscillator.connect(audioCtx.destination);
      oscillator.start(time);
      time += 0.5; // Пауза между нотами
      oscillator.stop(time);
    });
  };
  const autoCorrelate = (buf: Uint8Array, sampleRate: number) => {
    const SIZE = buf.length;
    let bestOffset = -1;
    let bestCorrelation = 0;

    for (let offset = 4; offset < SIZE / 2; offset++) {
      let correlation = 0;
      for (let i = 0; i < SIZE - offset; i++) {
        correlation += Math.abs(
          (buf[i] - 128) / 128 - (buf[i + offset] - 128) / 128
        );
      }
      correlation = 1 - (correlation / SIZE);
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    }

    return bestCorrelation > 0.01 ? sampleRate / bestOffset : -1;
  };

  const decode = () => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      const input = audioContext.createMediaStreamSource(stream);
      input.connect(analyser);

      let binarySequence = '';
      let decodedText = '';
      let note = '';
      let collecting = false;

      const processAudio = () => {
        analyser.getByteTimeDomainData(dataArray);
        const freq = autoCorrelate(dataArray, audioContext.sampleRate);
        console.log('freq', freq)
      
        if (freq !== -1) {
          if (freq >= 200 && freq <= 270) {
            note = 'B4'; 
          } else if (freq >= 400 && freq <= 450) {
            note = 'C4'; 
          } else {
            note = '';
          }

          if (note) {
            console.log('note ', note)
            binarySequence += note === 'B4' ? '0' : '1';
            console.log('binarySequence', binarySequence)

            if (binarySequence.length % 8 === 0) { 
              const segment = binarySequence.slice(-8);
              const char = String.fromCharCode(parseInt(segment, 2));
              console.log('char', char)

              decodedText += char;
              setDecodedText(decodedText);
            }
          }
        }
        requestAnimationFrame(processAudio);
      };

      processAudio();
    }).catch(error => {
      console.error('Ошибка доступа к микрофону:', error);
    });
  };

  return (
    <>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button onClick={singString}>
       Sing
      </button>
      <button onClick={decode}>
        Listen
      </button>
      <pre>Decoded Text: {decodedText}</pre>
    </>
  );
};

export default App;
