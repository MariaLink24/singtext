import React, { useState } from 'react';

const App = () => {
  const [value, setValue] = useState('');
  const [decodedText, setDecodedText] = useState('');

  const notes = {
    B: 261, 
    A: 440,
      'start': 800,
      'end': 1000,
      'break': 50

  };
    let isListening = false;

  const convertTextToBinary = (text: string) => {
    return text
      .split('')
      .map(char => char.charCodeAt(0).toString(2).padStart(8, '0')) 
      .join('');
  };

  const convertBinaryToNotes = (binary: string) => {
    const notesList = ['start'];
    for (let i = 0; i < binary.length; i++) {
      const bit = binary[i];
      notesList.push(bit === '0' ? 'B' : 'A');
      if (i%8===0) notesList.push('break')
    }
      notesList.push('end');
    return notesList;
  };

  let autoCorrelate = function(buf, sampleRate) {
    const SIZE = buf.length;
    const MAX_SAMPLES = Math.floor(SIZE / 2); 
    let best_offset = -1;
    let best_correlation = 0;
    let rms = 0;

    for (let i = 0; i < SIZE; i++) {
        let val = (buf[i] - 128) / 128;
        rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);

    if (rms < 0.01) {
        return -1;
    }

    let lastCorrelation = 1;
    for (let offset = 4; offset < MAX_SAMPLES; offset++) {
        let correlation = 0;

        for (let i = 0; i < SIZE - offset; i++) {
            correlation += Math.abs(((buf[i] - 128) / 128) - ((buf[i + offset] - 128) / 128));
        }
        correlation = 1 - (correlation / (SIZE - offset));

        if (correlation > lastCorrelation && correlation > best_correlation) {
            best_correlation = correlation;
            best_offset = offset;
        }
        lastCorrelation = correlation;
    }

    if (best_correlation > 0.01) {
        return sampleRate / best_offset;
    }

    return -1; 
};


  const send = () => {
    const binarySequence = convertTextToBinary(value);
    const notesToPlay = convertBinaryToNotes(binarySequence);
    console.log(`Binary sequence at first: ${binarySequence}`);

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let time = audioCtx.currentTime; 
console.log('notesToPlay:', notesToPlay);
    notesToPlay.forEach(note => {
      const oscillator = audioCtx.createOscillator();
      oscillator.frequency.setValueAtTime(notes[note], time);
      oscillator.connect(audioCtx.destination);
      oscillator.start(time);
      time += 0.5; 
      oscillator.stop(time);
    });
  };

  const start = () => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
  
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      const input = audioContext.createMediaStreamSource(stream);
      input.connect(analyser);

        let binarySequence= [];
      let decodedText = '';
      let note = '';
      let collecting = false;
      let allnotes = [];

      const processAudio = () => {
        analyser.getByteTimeDomainData(dataArray);
        const freq = autoCorrelate(dataArray, audioContext.sampleRate);
 console.log('freq ', freq)
          ///записывать первую букву и ждать следующего брейка
        if (freq !== -1) {
            if (freq >750 && freq <850 ){
                isListening = true;
                console.log('Start listening')
            }
            if (freq >900 && freq <1100){
                console.error('Data stream terminated')
                isListening = false;
                  input.mediaStream.getAudioTracks()[0].enabled = false;
            }
            if (freq >45 && freq <65){
               note = 'break'
            }
          if (freq >= 230 && freq <= 270) {
            note = 'B'; 
          } else if (freq >= 400 && freq <= 450) {
            note = 'A'; 
          } else {
            note = '';
          }

          if (note && isListening) {
            console.log(`Detected note: ${note}`);
              console.log('binarySequence', binarySequence)
              binarySequence.filter(n=> n!=='break')
            binarySequence.push(note === 'B' ? '0' : '1');
            if (binarySequence.length >= 8 && binarySequence % 8 === 0) {
              const segment = binarySequence.slice(0, 8);
              console.log('char')
              const char = String.fromCharCode(parseInt(segment, 2));
              console.log('char', char)

              decodedText += char;
              setDecodedText(decodedText);
  
              console.log(`Decoded character: ${char}`);
              console.log(`Full decoded text: ${decodedText}`);

              binarySequence = binarySequence.slice(8); 
            }
            
          }

        }
        requestAnimationFrame(processAudio);


      };

        processAudio();
      console.log(`Binary sequence: ${binarySequence}`);
        console.log('allnotes:', allnotes);


    }).catch(error => {
      console.error('Error accessing microphone:', error);
    });
  };
  

  return (
    <>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter text"
      />
      <button onClick={send}>
        Play Music
      </button>
      <button onClick={start}>
        Start Listening
      </button>
      <pre>Decoded Text: {decodedText}</pre>
    </>
  );
};

export default App;
