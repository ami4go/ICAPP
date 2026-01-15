import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import PatientCard from './components/PatientCard';
import ChatInterface from './components/ChatInterface';
import './index.css';

function App() {
  const [session, setSession] = useState(null);
  const [patient, setPatient] = useState(null);
  const [state, setState] = useState({
    status: 'inactive',
    revealed_symptoms: [],
    needs_escalation: false
  });
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const startSession = async () => {
    setLoading(true);
    try {
      const data = await api.startSession();
      setSession(data.session_id);
      setPatient(data.patient);
      setState({
        status: 'active',
        revealed_symptoms: [],
        needs_escalation: false,
        // Hack: Store hidden data in state for debug UI
        debug: {
          disease: data.patient?.disease || "Hidden",
          correct_treatments: data.patient?.correct_treatments || []
        }
      });
      setMessages([]);
    } catch (err) {
      console.error("Failed to start session", err);
      // Check if it's a specific API error (like 500 from Groq)
      if (err.error) {
        alert(`Backend Error: ${err.error}`);
      } else {
        alert("Failed to start session. Ensure backend is running and Groq Key is valid.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (text) => {
    if (!session) return;

    // Add user message immediately
    const newMessages = [...messages, {
      sender: 'doctor',
      text: text,
      time: new Date().toLocaleTimeString()
    }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const data = await api.sendMessage(session, text);

      // Update messages with AI response
      setMessages(prev => [...prev, {
        sender: 'patient',
        text: data.reply,
        time: new Date().toLocaleTimeString()
      }]);

      // Update state
      if (data.state_summary) {
        setState(prev => ({
          ...prev,
          status: data.state_summary.status,
          revealed_symptoms: data.state_summary.revealed_symptoms,
          needs_escalation: data.state_summary.needs_escalation
        }));
      }

      if (data.done) {
        setMessages(prev => [...prev, {
          sender: 'system',
          text: `Session ended. Result: ${data.state_summary.status}`,
          time: new Date().toLocaleTimeString()
        }]);
      }

    } catch (err) {
      console.error("Error sending message", err);
      setMessages(prev => [...prev, {
        sender: 'system',
        text: "Error communicating with patient.",
        time: new Date().toLocaleTimeString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const endSession = async () => {
    if (session) {
      await api.endSession(session);
      setSession(null);
      setPatient(null);
      setMessages([]);
      setState({ status: 'inactive', revealed_symptoms: [], needs_escalation: false });
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          <span className="icon">🩺</span> AI Patient Simulator
        </div>
        <div className="controls">
          {!session ? (
            <button className="btn-primary" onClick={startSession} disabled={loading}>
              {loading ? 'Generating Case...' : 'Start New Session'}
            </button>
          ) : (
            <button className="btn-danger" onClick={endSession}>
              End Session
            </button>
          )}
        </div>
      </header>

      <main className="main-layout">
        <aside className="sidebar">
          <PatientCard patient={patient} state={state} />
        </aside>
        <section className="chat-section">
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            loading={loading}
            sessionActive={session && (state.status === 'active' || state.status === 'treated')}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
