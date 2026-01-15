const BASE = import.meta.env.VITE_API_URL || '';
const API_BASE_URL = BASE ? `${BASE}/api` : '/api';

export const api = {
    // Auth endpoints
    signup: async (name, username, password) => {
        const response = await fetch(`${API_BASE_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, username, password })
        });
        const data = await response.json();
        if (!response.ok) throw data;
        return data;
    },

    login: async (username, password) => {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (!response.ok) throw data;
        return data;
    },

    getHistory: async (username) => {
        const response = await fetch(`${API_BASE_URL}/history?username=${username}`);
        const data = await response.json();
        if (!response.ok) throw data;
        return data;
    },

    deleteHistory: async (username, sessionId = null) => {
        const response = await fetch(`${API_BASE_URL}/history/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, session_id: sessionId })
        });
        const data = await response.json();
        if (!response.ok) throw data;
        return data;
    },

    // Session endpoints
    startSession: async (doctorUsername = '') => {
        const response = await fetch(`${API_BASE_URL}/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ doctor_username: doctorUsername })
        });
        const data = await response.json();
        if (!response.ok) throw data;
        return data;
    },

    sendMessage: async (sessionId, message) => {
        const response = await fetch(`${API_BASE_URL}/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId, message })
        });
        return response.json();
    },

    getState: async (sessionId) => {
        const response = await fetch(`${API_BASE_URL}/state?session_id=${sessionId}`);
        return response.json();
    },

    endSession: async (sessionId, finalDiagnosis = '', prescriptions = '') => {
        const response = await fetch(`${API_BASE_URL}/end`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: sessionId,
                final_diagnosis: finalDiagnosis,
                prescriptions: prescriptions
            })
        });
        return response.json();
    },

    analyzeSymptoms: async (symptoms) => {
        const response = await fetch(`${API_BASE_URL}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symptoms })
        });
        return response.json();
    }
};
