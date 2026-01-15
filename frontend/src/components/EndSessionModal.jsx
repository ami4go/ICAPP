import React, { useState } from 'react';

const EndSessionModal = ({ onConfirm, onCancel }) => {
    const [diagnosis, setDiagnosis] = useState('');
    const [prescriptions, setPrescriptions] = useState('');

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div className="glass-panel" style={{
                width: '450px',
                padding: '2rem'
            }}>
                <h2 style={{ color: '#0ea5a4', margin: '0 0 1.5rem 0' }}>
                    End Session
                </h2>
                <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
                    Enter your final diagnosis and any prescriptions for this patient case.
                </p>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>
                        Final Diagnosis
                    </label>
                    <input
                        type="text"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        placeholder="e.g., Migraine, Ankle Sprain"
                        style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '0.75rem 1rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '1rem'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>
                        Prescriptions / Recommendations
                    </label>
                    <textarea
                        value={prescriptions}
                        onChange={(e) => setPrescriptions(e.target.value)}
                        placeholder="e.g., Ibuprofen 400mg, Rest, Ice application"
                        rows={3}
                        style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '0.75rem 1rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '1rem',
                            resize: 'vertical',
                            fontFamily: 'inherit'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            flex: 1,
                            padding: '12px',
                            background: 'transparent',
                            border: '1px solid #94a3b8',
                            color: '#94a3b8',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '1rem'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(diagnosis, prescriptions)}
                        className="btn-primary"
                        style={{
                            flex: 1,
                            padding: '12px',
                            fontSize: '1rem'
                        }}
                    >
                        Save & End
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EndSessionModal;
