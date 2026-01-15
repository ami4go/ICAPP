import React, { useState } from 'react';
import { api } from './services/api';
import PatientCard from './components/PatientCard';
import ChatInterface from './components/ChatInterface';
import AuthPage from './components/AuthPage';
import HistoryPage from './components/HistoryPage';
import EndSessionModal from './components/EndSessionModal';
import './index.css';

function App() {
  // Auth state
  const [doctor, setDoctor] = useState(null); // {username, name}
  const [currentPage, setCurrentPage] = useState('auth'); // 'auth', 'dashboard', 'history'

  // Session state
  const [session, setSession] = useState(null);
  const [patient, setPatient] = useState(null);
  const [state, setState] = useState({
    status: 'inactive',
    revealed_symptoms: [],
    needs_escalation: false
  });
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);

  const handleAuthSuccess = (username, name) => {
    setDoctor({ username, name });
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    if (session) {
      api.endSession(session);
    }
    setDoctor(null);
    setSession(null);
    setPatient(null);
    setMessages([]);
    setCurrentPage('auth');
  };

  const startSession = async () => {
    setLoading(true);
    try {
      const data = await api.startSession(doctor?.username || '');
      setSession(data.session_id);
      setPatient(data.patient);
      setState({
        status: 'active',
        revealed_symptoms: [],
        needs_escalation: false,
        debug: {
          disease: data.patient?.disease || "Hidden",
          correct_treatments: data.patient?.correct_treatments || []
        }
      });
      setMessages([]);
    } catch (err) {
      console.error("Failed to start session", err);
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

    const newMessages = [...messages, {
      sender: 'doctor',
      text: text,
      time: new Date().toLocaleTimeString()
    }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const data = await api.sendMessage(session, text);

      setMessages(prev => [...prev, {
        sender: 'patient',
        text: data.reply,
        time: new Date().toLocaleTimeString()
      }]);

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

  const handleEndClick = () => {
    setShowEndModal(true);
  };

  const endSession = async (finalDiagnosis = '', prescriptions = '') => {
    if (session) {
      await api.endSession(session, finalDiagnosis, prescriptions);
      setSession(null);
      setPatient(null);
      setMessages([]);
      setState({ status: 'inactive', revealed_symptoms: [], needs_escalation: false });
      setShowEndModal(false);
    }
  };

  // Route: Auth Page
  if (currentPage === 'auth' || !doctor) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  // Route: History Page
  if (currentPage === 'history') {
    return (
      <HistoryPage
        doctorUsername={doctor.username}
        doctorName={doctor.name}
        onBack={() => setCurrentPage('dashboard')}
      />
    );
  }

  // Route: Dashboard (Main App)
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          <span className="icon">🩺</span> AI Patient Simulator
        </div>
        <div className="controls" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Dr. {doctor.name}
          </span>
          <button
            onClick={() => setCurrentPage('history')}
            style={{
              background: 'transparent',
              border: '1px solid #94a3b8',
              color: '#94a3b8',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            📋 History
          </button>
          {!session ? (
            <button className="btn-primary" onClick={startSession} disabled={loading}>
              {loading ? 'Generating Case...' : 'Start New Session'}
            </button>
          ) : (
            <button className="btn-danger" onClick={handleEndClick}>
              End Session
            </button>
          )}
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              padding: '8px'
            }}
          >
            Logout
          </button>
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

      {/* End Session Modal */}
      {showEndModal && (
        <EndSessionModal
          onConfirm={(diagnosis, prescrips) => endSession(diagnosis, prescrips)}
          onCancel={() => setShowEndModal(false)}
        />
      )}
    </div>
  );
}

export default App;
