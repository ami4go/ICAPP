# AI Patient Simulator

A LangGraph-driven patient simulation chatbot for medical training.

## Prerequisites
- Python 3.9+
- Node.js 16+
- Groq API Key

## Setup

1.  **Backend Setup**
    ```bash
    cd api
    python -m venv venv
    .\venv\Scripts\activate
    pip install -r requirements.txt
    ```
    Create `api/.env` with your keys:
    ```
    GROQ_API_KEY=sk-your-key-here
    FLASK_SECRET_KEY=dev-secret
    ```

2.  **Frontend Setup**
    ```bash
    cd frontend
    npm install --no-bin-links --ignore-scripts
    ```
    *Note: If you encounter permission errors (EPERM) on Windows/OneDrive, the flags above help avoid file locking issues.*

## Running the Application

1.  **Start Backend** (Terminal 1)
    ```bash
    cd api
    python app.py
    ```
    Runs on `http://localhost:5000`.

2.  **Start Frontend** (Terminal 2)
    ```bash
    cd frontend
    npm install --no-bin-links --ignore-scripts
    node node_modules/vite/bin/vite.js
    ```
    Runs on `http://localhost:5173`.

## Architecture
- **Backend**: Flask API + LangGraph Agent (`api/agent.py`).
- **Frontend**: React + Vite + Vanilla CSS Premium Styling.
- **State**: In-memory session storage (for demo).

## Features
- Dynamic Patient Generation via Groq.
- Persistent Session State using LangGraph logic.
- Progressive Symptom Revelation.
- Premium UI with Glassmorphism.
