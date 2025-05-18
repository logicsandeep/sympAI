import React, { useState, useEffect, useRef } from 'react';

function App() {
  const [text, setText] = useState('');
  const [response, setResponse] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognition = new (window as any).webkitSpeechRecognition();
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  useEffect(() => {
    if (voiceEnabled && response) {
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
      const utterance = new SpeechSynthesisUtterance(response);
      speechUtteranceRef.current = utterance;
  
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
  
      speechSynthesis.speak(utterance);
    }
  }, [response, voiceEnabled]);

  const handleVoiceInput = () => {
    setIsRecording(true);
    recognition.start();
    recognition.onresult = (event: any) => {
      const speechText = event.results[0][0].transcript;
      setText(speechText);
      setIsRecording(false);
    };
  };

  const sendSymptoms = async () => {
    const symptomKeywords = [
      'fever', 'cough', 'pain', 'headache', 'nausea', 'fatigue', 'dizziness',
      'sore throat', 'vomiting', 'diarrhea', 'chills', 'rash', 'infection', 'symptom',
      'swelling', 'cramps', 'bleeding', 'congestion', 'shortness of breath'
    ];
  
    const isSymptomRelated = symptomKeywords.some(keyword =>
      text.toLowerCase().includes(keyword)
    );
  
    if (!isSymptomRelated) {
      setResponse("⚠️ Please ask a question related to medical symptoms only.");
      return;
    }
    
    setResponse('');
    const res = await fetch('http://localhost:8000/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder('utf-8');

    if (reader) {
      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunk = decoder.decode(value);
        setResponse((prev) => prev + chunk);
      }
    }
  };
  const handlePauseSpeech = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  };
  return (
    <div style={styles.container}>
      <h1 style={styles.header}>SympAI - Health Checker</h1>
      <textarea
        style={styles.textarea}
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Describe your symptoms here..."
      />
      <div style={styles.buttonRow}>
        <button style={styles.sendButton} onClick={sendSymptoms}>
          Send
        </button>
        <button style={styles.voiceButton} onClick={handleVoiceInput} disabled={isRecording}>
          {isRecording ? 'Listening...' : 'Use Voice'}
        </button>
        {isSpeaking && (
          <button style={styles.pauseButton} onClick={handlePauseSpeech}>
            Pause
          </button>
        )}
        <label style={styles.voiceLabel}>
          <input
            type="checkbox"
            checked={voiceEnabled}
            onChange={() => setVoiceEnabled(!voiceEnabled)}
            style={{ marginRight: 6 }}
          />
          Voice Response
        </label>
      </div>
      {response && (
        <div style={styles.responseBox}>
          <pre style={styles.responseText}>{response}</pre>
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: 600,
    margin: '40px auto',
    padding: 20,
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: '#fff',
    color: '#000',
  },
  header: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0057b7', // blue
    textAlign: 'center',
    marginBottom: 24,
  },
  textarea: {
    width: '100%',
    padding: 12,
    fontSize: 16,
    borderRadius: 8,
    border: '2px solid #0057b7',
    resize: 'vertical',
    marginBottom: 20,
  },
  buttonRow: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  sendButton: {
    backgroundColor: '#ff6600', // orange
    border: 'none',
    color: '#fff',
    fontWeight: '600',
    padding: '12px 28px',
    borderRadius: 8,
    cursor: 'pointer',
    flexShrink: 0,
  },
  voiceButton: {
    backgroundColor: '#ff6600', // orange
    border: 'none',
    color: '#fff',
    fontWeight: '600',
    padding: '12px 28px',
    borderRadius: 8,
    cursor: 'pointer',
    flexShrink: 0,
  },
  voiceLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 14,
    userSelect: 'none',
  },
  pauseButton: {
    backgroundColor: '#888',
    border: 'none',
    color: '#fff',
    fontWeight: '600',
    padding: '12px 28px',
    borderRadius: 8,
    cursor: 'pointer',
    flexShrink: 0,
  },  
  responseBox: {
    backgroundColor: '#fff',
    border: '2px solid #0057b7',
    borderRadius: 12,
    padding: 16,
    whiteSpace: 'pre-wrap',
    boxShadow: '0 0 8px rgba(0,87,183,0.2)',
  },
  responseText: {
    margin: 0,
    fontSize: 16,
    lineHeight: 1.4,
  },
};

export default App;
