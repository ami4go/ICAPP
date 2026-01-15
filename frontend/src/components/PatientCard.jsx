import React from 'react';

const PatientCard = ({ patient, state }) => {
    const [revealed, setRevealed] = React.useState(false);

    // Reset revealed state when patient changes
    React.useEffect(() => {
        setRevealed(false);
    }, [patient]);

    if (!patient) return null;

    return (
        <div className="patient-card glass-panel">
            <div className="patient-header">
                <div className="avatar-placeholder">
                    {state.status === 'resolved' ? '😊' : state.needs_escalation ? '😟' : '😐'}
                </div>
                <div>
                    <h3>Patient Case</h3>
                    <span className={`status-badge ${state.status}`}>{state.status.toUpperCase()}</span>
                </div>
            </div>

            <div className="patient-details">
                <div className="detail-row">
                    <span className="label">Name</span>
                    <span className="value">{patient.name}</span>
                </div>
                <div className="detail-row">
                    <span className="label">Age Group</span>
                    <span className="value">{patient.age_range}</span>
                </div>
                <div className="detail-row">
                    <span className="label">Sex</span>
                    <span className="value">{patient.sex}</span>
                </div>

            </div>

            <div className="symptoms-section" style={{
                marginTop: '1.5rem',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '12px',
                padding: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
                <h4 style={{
                    marginTop: 0,
                    marginBottom: '0.8rem',
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'rgba(255, 255, 255, 0.6)'
                }}>
                    Diagnosis Key Facts
                </h4>

                {state.revealed_symptoms && state.revealed_symptoms.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {state.revealed_symptoms.map((sym, i) => (
                            <span key={i} className="symptom-chip fade-in" style={{
                                background: 'rgba(14, 165, 233, 0.15)',
                                color: '#38bdf8',
                                border: '1px solid rgba(14, 165, 233, 0.3)',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '0.85rem',
                                fontWeight: '500'
                            }}>
                                {sym}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="empty-text" style={{ fontStyle: 'italic', opacity: 0.5 }}>
                        No symptoms revealed yet.
                    </p>
                )}
            </div>

            {/* Analyze Button Section */}
            {state.revealed_symptoms && state.revealed_symptoms.length >= 3 && (
                <div style={{ marginTop: '1rem' }}>
                    {!revealed ? (
                        <button
                            onClick={() => setRevealed(true)}
                            style={{
                                width: '100%',
                                padding: '10px 16px',
                                background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                transition: 'transform 0.2s, box-shadow 0.2s'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 4px 12px rgba(14, 165, 233, 0.3)';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = 'none';
                            }}
                        >
                            🔍 Analyze Symptoms
                        </button>
                    ) : (
                        <div className="analysis-result fade-in" style={{
                            background: 'rgba(139, 92, 246, 0.1)',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            borderRadius: '12px',
                            padding: '1rem'
                        }}>
                            <h4 style={{
                                margin: '0 0 0.5rem 0',
                                fontSize: '0.8rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                color: 'rgba(255, 255, 255, 0.6)'
                            }}>
                                Possible Condition
                            </h4>
                            <p style={{
                                margin: 0,
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                color: '#a78bfa'
                            }}>
                                {state.debug?.disease || 'Analysis complete'}
                            </p>
                            <button
                                onClick={() => setRevealed(false)}
                                style={{
                                    marginTop: '0.75rem',
                                    padding: '4px 12px',
                                    background: 'transparent',
                                    border: '1px solid rgba(139, 92, 246, 0.5)',
                                    borderRadius: '4px',
                                    color: '#a78bfa',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Hide
                            </button>
                        </div>
                    )}
                </div>
            )}

        </div >
    );
};

export default PatientCard;
