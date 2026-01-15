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


            {
                state.debug && (
                    <div className="debug-panel glass-panel" style={{ marginTop: '20px', border: '1px solid #0ea5e9', background: 'rgba(14, 165, 233, 0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ color: '#0ea5e9', margin: 0 }}>Possible Condition</h4>
                            {state.revealed_symptoms && state.revealed_symptoms.length >= 5 ? (
                                <button
                                    onClick={() => setRevealed(!revealed)}
                                    style={{
                                        background: 'transparent',
                                        border: '1px solid #0ea5e9',
                                        color: '#0ea5e9',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    {revealed ? 'Hide' : 'Reveal'}
                                </button>
                            ) : (
                                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                                    Locked 🔒 ({state.revealed_symptoms ? state.revealed_symptoms.length : 0}/5)
                                </span>
                            )}
                        </div>
                        {revealed && <p style={{ margin: '10px 0 0 0', fontWeight: 'bold' }}>{state.debug.disease}</p>}
                    </div>
                )
            }
        </div >
    );
};

export default PatientCard;
