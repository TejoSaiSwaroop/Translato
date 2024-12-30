import React, { useState, useRef, useEffect } from 'react';
// import dotenv from 'dotenv';
// dotenv.config();
const App = () => {
  const [transcript, setTranscript] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voices, setVoices] = useState([]);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const synth = window.speechSynthesis;
    const loadVoices = () => {
      const voices = synth.getVoices();
      setVoices(voices);
    };
    loadVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleStartListening = () => {
    setIsListening(true);
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'te-IN';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          setTranscript((prev) => {
            const updatedTranscript = prev + transcriptPart;
            translateText(updatedTranscript);
            return updatedTranscript;
          });
        } else {
          interimTranscript += transcriptPart;
        }
      }
      console.log('Interim Transcript:', interimTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const handleStopListening = () => {
    setIsListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };
  const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
  const translateText = (text) => {
   
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        target: 'ta-IN', // Telugu language code
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.data && data.data.translations) {
          setTranslatedText(data.data.translations[0].translatedText);
        }
      })
      .catch((error) => {
        console.error('Error translating text:', error);
      });
  };

  const handleSpeak = () => {
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: { text: translatedText },
        voice: { languageCode: 'ta-IN', ssmlGender: 'NEUTRAL' },
        audioConfig: { audioEncoding: 'MP3' },
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        const audioContent = data.audioContent;
        const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
        audio.play();
      })
      .catch((error) => {
        console.error('Error synthesizing speech:', error);
      });
  };

  return (
    <div>
      <h1>Speech to Text</h1>
      <button onClick={isListening ? handleStopListening : handleStartListening}>
        {isListening ? 'Stop Listening' : 'Start Listening'}
      </button>
      <p>Original Text: {transcript}</p>
      <p>Translated Text: {translatedText}</p>
      <button onClick={handleSpeak}>Speak Translated Text</button>
    </div>
  );
};

export default App;