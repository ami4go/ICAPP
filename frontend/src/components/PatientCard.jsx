import React from 'react';
import { api } from '../services/api';

const PatientCard = ({ patient, state }) => {
    const [analysisResult, setAnalysisResult] = React.useState(null);
    const [analyzing, setAnalyzing] = React.useState(false);
    const [lastAnalyzedCount, setLastAnalyzedCount] = React.useState(0);

    // Reset analysis when patient changes
    React.useEffect(() => {
        setAnalysisResult(null);
        setLastAnalyzedCount(0);
    }, [patient]);

    // Show analyze button if we have 3+ symptoms AND either:
    // - Haven't analyzed yet, OR
    // - Have new symptoms since last analysis
    const symptomCount = state.revealed_symptoms?.length || 0;
    const shouldShowAnalyzeButton = symptomCount >= 3 && symptomCount > lastAnalyzedCount;

    const handleAnalyze = async () => {
        if (!state.revealed_symptoms || state.revealed_symptoms.length < 1) return;

        setAnalyzing(true);
        try {
            const result = await api.analyzeSymptoms(state.revealed_symptoms);
            setAnalysisResult(result.conditions || []);
            setLastAnalyzedCount(symptomCount);
        } catch (err) {
            console.error("Analysis failed:", err);
            setAnalysisResult([{ name: "Analysis failed", confidence: "N/A", reasoning: "Please try again" }]);
        } finally {
            setAnalyzing(false);
        }
    };

    if (!patient) return null;

    return (
        <div className="patient-card glass-panel" style={{ overflowY: 'auto' }}>
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

            {/* Analyze Button - Appears when 3+ symptoms and new symptoms since last analysis */}
            {shouldShowAnalyzeButton && (
                <div style={{ marginTop: '1rem' }}>
                    <button
                        onClick={handleAnalyze}
                        disabled={analyzing}
                        style={{
                            width: '100%',
                            padding: '10px 16px',
                            background: analyzing ? '#666' : 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            cursor: analyzing ? 'wait' : 'pointer'
                        }}
                    >
                        {analyzing ? '⏳ Analyzing...' : '🔍 Analyze Symptoms'}
                    </button>
                </div>
            )}

            {/* Analysis Results */}
            {analysisResult && analysisResult.length > 0 && (
                <div style={{
                    marginTop: '1rem',
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '12px',
                    padding: '1.25rem'
                }}>
                    <h4 style={{
                        margin: '0 0 0.75rem 0',
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'rgba(255, 255, 255, 0.6)'
                    }}>
                        Possible Conditions
                    </h4>
                    {analysisResult.map((condition, i) => (
                        <div key={i} style={{
                            marginBottom: i < analysisResult.length - 1 ? '0.75rem' : 0,
                            paddingBottom: i < analysisResult.length - 1 ? '0.75rem' : 0,
                            borderBottom: i < analysisResult.length - 1 ? '1px solid rgba(139, 92, 246, 0.2)' : 'none'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: '600', color: '#a78bfa', fontSize: '0.95rem' }}>
                                    {condition.name}
                                </span>
                                <span style={{
                                    fontSize: '0.7rem',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background: condition.confidence === 'High' ? 'rgba(34, 197, 94, 0.2)' :
                                        condition.confidence === 'Medium' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                    color: condition.confidence === 'High' ? '#22c55e' :
                                        condition.confidence === 'Medium' ? '#eab308' : '#ef4444'
                                }}>
                                    {condition.confidence}
                                </span>
                            </div>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', opacity: 0.7 }}>
                                {condition.reasoning}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PatientCard;
