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

    // Session Detail View
    if (selectedSession) {
        const symptoms = selectedSession.revealed_symptoms || [];

        return (
            <div style={{
                minHeight: '100vh',
                background: 'radial-gradient(circle at top right, #1e293b 0%, #0f172a 100%)',
                padding: '2rem'
            }}>
                <div style={{ maxWidth: '700px', margin: '0 auto' }}>
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

                    <div className="glass-panel" style={{ padding: '2rem' }}>
                        <h2 style={{ color: '#0ea5a4', margin: '0 0 1.5rem 0', textAlign: 'center' }}>
                            Patient Case Summary
                        </h2>

                        {/* Patient Info */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '1rem',
                            marginBottom: '1.5rem',
                            textAlign: 'center'
                        }}>
                            <div>
                                <span style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>Name</span>
                                <p style={{ margin: '0.25rem 0 0 0', fontWeight: '600' }}>{selectedSession.patient_name}</p>
                            </div>
                            <div>
                                <span style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>Sex</span>
                                <p style={{ margin: '0.25rem 0 0 0', fontWeight: '600' }}>{selectedSession.patient_sex || 'Unknown'}</p>
                            </div>
                            <div>
                                <span style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>Age</span>
                                <p style={{ margin: '0.25rem 0 0 0', fontWeight: '600' }}>{selectedSession.patient_age || 'Unknown'}</p>
                            </div>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '1.5rem 0' }} />

                        {/* Symptoms */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ color: '#94a3b8', margin: '0 0 0.75rem 0', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                                Symptoms Revealed
                            </h4>
                            {symptoms.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {symptoms.map((s, i) => (
                                        <span key={i} style={{
                                            background: 'rgba(14, 165, 233, 0.15)',
                                            color: '#38bdf8',
                                            padding: '6px 12px',
                                            borderRadius: '20px',
                                            fontSize: '0.9rem'
                                        }}>{s}</span>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>No symptoms revealed</p>
                            )}
                        </div>

                        {/* Final Diagnosis */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ color: '#94a3b8', margin: '0 0 0.75rem 0', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                                Final Diagnosis
                            </h4>
                            <p style={{
                                margin: 0,
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                color: selectedSession.final_diagnosis === 'Not provided' ? '#94a3b8' : '#a78bfa'
                            }}>
                                {selectedSession.final_diagnosis || 'Not provided'}
                            </p>
                        </div>

                        {/* Prescriptions */}
                        <div>
                            <h4 style={{ color: '#94a3b8', margin: '0 0 0.75rem 0', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                                Prescriptions / Recommendations
                            </h4>
                            <p style={{
                                margin: 0,
                                color: selectedSession.prescriptions === 'Not provided' ? '#94a3b8' : 'white',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {selectedSession.prescriptions || 'Not provided'}
                            </p>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '1.5rem 0' }} />

                        <p style={{ color: '#94a3b8', fontSize: '0.8rem', textAlign: 'center', margin: 0 }}>
                            Session Date: {new Date(selectedSession.timestamp).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // History List View  
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
                                        <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.85rem' }}>
                                            {session.patient_sex || 'Unknown'} • {session.patient_age || 'Unknown'} •
                                            {(session.revealed_symptoms || []).length} symptoms
                                        </p>
                                        <p style={{ color: '#a78bfa', margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                                            Dx: {session.final_diagnosis || 'Not provided'}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                                            {new Date(session.timestamp).toLocaleDateString()}
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
