const BASE = import.meta.env.VITE_API_URL || '';
const API_BASE_URL = BASE ? `${BASE}/api` : '/api';

export const api = {
    startSession: async () => {
        const response = await fetch(`${API_BASE_URL}/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        const data = await response.json();
        if (!response.ok) {
            throw data;
        }
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

    endSession: async (sessionId) => {
        const response = await fetch(`${API_BASE_URL}/end`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId })
        });
        return response.json();
    }
};
