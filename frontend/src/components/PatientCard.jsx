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

            <div className="symptoms-timeline">
                <h4>Revealed Symptoms</h4>
                {state.revealed_symptoms && state.revealed_symptoms.length > 0 ? (
                    <ul>
                        {state.revealed_symptoms.map((sym, i) => (
                            <li key={i} className="symptom-item fade-in">
                                {sym}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="empty-text">Ask questions to reveal symptoms.</p>
                )}
            </div>


            {/* Removed Debug Panel as per user request */}
        </div >
    );
};

export default PatientCard;
