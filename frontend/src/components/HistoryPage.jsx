import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const HistoryPage = ({ doctorUsername, doctorName, onBack }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState(null);

    useEffect(() => {
        loadHistory();
    }, [doctorUsername]);

    const loadHistory = async () => {
        try {
            const data = await api.getHistory(doctorUsername);
            setHistory(data.history || []);
        } catch (err) {
            console.error("Failed to load history:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSession = async (sessionId, e) => {
        e.stopPropagation();
        if (!confirm('Delete this session from history?')) return;

        try {
            await api.deleteHistory(doctorUsername, sessionId);
            setHistory(prev => prev.filter(h => h.session_id !== sessionId));
        } catch (err) {
            console.error("Failed to delete:", err);
        }
    };

    const handleClearAll = async () => {
        if (!confirm('Clear ALL session history? This cannot be undone.')) return;

        try {
            await api.deleteHistory(doctorUsername);
            setHistory([]);
        } catch (err) {
            console.error("Failed to clear:", err);
        }
    };

    if (selectedSession) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'radial-gradient(circle at top right, #1e293b 0%, #0f172a 100%)',
                padding: '2rem'
            }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <button
                        onClick={() => setSelectedSession(null)}
                        style={{
                            background: 'transparent',
                            border: '1px solid #94a3b8',
                            color: '#94a3b8',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            marginBottom: '1rem'
                        }}
                    >
                        ← Back to History
                    </button>

                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                        <h2 style={{ color: '#0ea5a4', margin: '0 0 0.5rem 0' }}>
                            Session with {selectedSession.patient_name}
                        </h2>
                        <p style={{ color: '#94a3b8', margin: '0 0 1.5rem 0' }}>
                            {new Date(selectedSession.timestamp).toLocaleString()} •
                            Disease: <span style={{ color: '#a78bfa' }}>{selectedSession.disease}</span>
                        </p>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ color: '#94a3b8', margin: '0 0 0.5rem 0' }}>Revealed Symptoms:</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {selectedSession.revealed_symptoms.map((s, i) => (
                                    <span key={i} style={{
                                        background: 'rgba(14, 165, 233, 0.15)',
                                        color: '#38bdf8',
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '0.85rem'
                                    }}>{s}</span>
                                ))}
                            </div>
                        </div>

                        <h4 style={{ color: '#94a3b8', margin: '0 0 1rem 0' }}>Chat Transcript:</h4>
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {selectedSession.chat_history && selectedSession.chat_history.map((msg, i) => (
                                <div key={i} style={{
                                    marginBottom: '1rem',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '12px',
                                    background: msg.role === 'doctor' ? 'rgba(14, 165, 164, 0.2)' : 'rgba(51, 65, 85, 0.5)',
                                    marginLeft: msg.role === 'doctor' ? 'auto' : 0,
                                    marginRight: msg.role === 'doctor' ? 0 : 'auto',
                                    maxWidth: '80%'
                                }}>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                                        {msg.role === 'doctor' ? 'You' : 'Patient'}
                                    </span>
                                    <p style={{ margin: '0.25rem 0 0 0' }}>{msg.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'radial-gradient(circle at top right, #1e293b 0%, #0f172a 100%)',
            padding: '2rem'
        }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ color: '#0ea5a4', margin: 0 }}>Session History</h1>
                        <p style={{ color: '#94a3b8', margin: '0.5rem 0 0 0' }}>Dr. {doctorName}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {history.length > 0 && (
                            <button
                                onClick={handleClearAll}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid #ef4444',
                                    color: '#ef4444',
                                    padding: '10px 16px',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                🗑️ Clear All
                            </button>
                        )}
                        <button
                            onClick={onBack}
                            className="btn-primary"
                            style={{ padding: '10px 20px' }}
                        >
                            New Session
                        </button>
                    </div>
                </div>

                {loading ? (
                    <p style={{ textAlign: 'center', color: '#94a3b8' }}>Loading...</p>
                ) : history.length === 0 ? (
                    <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
                        <p style={{ fontSize: '3rem', margin: 0 }}>📋</p>
                        <p style={{ color: '#94a3b8' }}>No sessions yet. Start your first patient session!</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {history.map((session, i) => (
                            <div
                                key={session.session_id || i}
                                className="glass-panel"
                                onClick={() => setSelectedSession(session)}
                                style={{
                                    cursor: 'pointer',
                                    padding: '1.25rem'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 0.25rem 0' }}>{session.patient_name}</h3>
                                        <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
                                            {new Date(session.timestamp).toLocaleDateString()} •
                                            {session.revealed_symptoms.length} symptoms revealed
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{
                                            background: session.status === 'resolved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                                            color: session.status === 'resolved' ? '#10b981' : '#eab308',
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            fontSize: '0.8rem',
                                            fontWeight: '600'
                                        }}>
                                            {session.status}
                                        </span>
                                        <button
                                            onClick={(e) => handleDeleteSession(session.session_id, e)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#ef4444',
                                                cursor: 'pointer',
                                                padding: '4px 8px',
                                                fontSize: '1rem'
                                            }}
                                            title="Delete session"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistoryPage;
