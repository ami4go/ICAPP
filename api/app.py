import os
import uuid
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from agent import generate_patient_case, process_turn

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'default-secret-key')

# Simple in-memory session storage for demo (Move to Redis for production)
sessions = {}

# Doctor accounts storage: {username: {name, password, history: []}}
doctors = {}

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "Backend is running"})

@app.route('/api/signup', methods=['POST'])
def signup():
    """Register a new doctor account."""
    data = request.json
    username = data.get('username', '').strip().lower()
    password = data.get('password', '')
    name = data.get('name', '').strip()
    
    if not username or not password or not name:
        return jsonify({"error": "Name, username, and password are required"}), 400
    
    if len(username) < 3:
        return jsonify({"error": "Username must be at least 3 characters"}), 400
    
    if len(password) < 4:
        return jsonify({"error": "Password must be at least 4 characters"}), 400
    
    if username in doctors:
        return jsonify({"error": "Username already exists"}), 409
    
    # Create doctor account
    doctors[username] = {
        "name": name,
        "password": password,  # In production, hash this!
        "history": []
    }
    
    return jsonify({"message": "Account created successfully", "username": username, "name": name})

@app.route('/api/login', methods=['POST'])
def login():
    """Authenticate doctor login."""
    data = request.json
    username = data.get('username', '').strip().lower()
    password = data.get('password', '')
    
    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400
    
    if username not in doctors:
        return jsonify({"error": "Username not found"}), 404
    
    if doctors[username]["password"] != password:
        return jsonify({"error": "Incorrect password"}), 401
    
    return jsonify({
        "message": "Login successful",
        "username": username,
        "name": doctors[username]["name"]
    })

@app.route('/api/history', methods=['GET'])
def get_history():
    """Get session history for a doctor."""
    username = request.args.get('username', '').strip().lower()
    
    if not username or username not in doctors:
        return jsonify({"error": "Doctor not found"}), 404
    
    return jsonify({"history": doctors[username]["history"]})

@app.route('/api/start', methods=['POST'])
def start_session():
    try:
        data = request.json or {}
        doctor_username = data.get('doctor_username', '').strip().lower()
        
        # Generate a new patient case (uses 8b instant for speed + fallback safety)
        patient_case = generate_patient_case()
        
        session_id = str(uuid.uuid4())
        
        # Initialize session state
        sessions[session_id] = {
            "session_id": session_id,
            "doctor_username": doctor_username,  # Link to doctor
            "patient_case": patient_case,
            "revealed_symptoms": [],
            "asked_questions": [],
            "treatment_given": [],
            "status": "active",
            "messages": [],
            "chat_history": []  # Store readable chat for history
        }
        
        return jsonify({
            "session_id": session_id, 
            "message": "Session started",
            "patient_summary": patient_case["presenting_summary"],
            "patient": {
                "name": patient_case.get("name", "Unknown"),
                "age_range": patient_case.get("age_range", "Unknown"),
                "sex": patient_case.get("sex", "Unknown")
            }
        })
    except Exception as e:
        print(f"Error starting session: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/message', methods=['POST'])
def message():
    data = request.json
    session_id = data.get('session_id')
    user_message = data.get('message')
    
    if not session_id or session_id not in sessions:
        return jsonify({"error": "Invalid or expired session"}), 404
    
    if not user_message:
        return jsonify({"error": "Message is required"}), 400
        
    state = sessions[session_id]
    
    try:
        # Process the turn using the detailed agent logic (uses 70b for chat)
        result = process_turn(state, user_message)
        
        # Update state
        state["messages"].extend(result["history_update"])
        
        # Update metadata if provided
        if "metadata" in result:
            meta = result["metadata"]
            if "revealed" in meta:
                # Add unique new symptoms
                for sym in meta["revealed"]:
                    if sym not in state["revealed_symptoms"]:
                        state["revealed_symptoms"].append(sym)
            if "status" in meta:
                state["status"] = meta["status"]
        
        # Store readable chat for history replay
        state["chat_history"].append({"role": "doctor", "text": user_message})
        state["chat_history"].append({"role": "patient", "text": result["reply"]})
                
        # Persist (in-memory)
        sessions[session_id] = state
        
        return jsonify({
            "reply": result["reply"],
            "metadata": result.get("metadata", {}),
            "state_summary": {
                "revealed_symptoms": state["revealed_symptoms"],
                "status": state["status"]
            }
        })
        
    except Exception as e:
        print(f"Error processing message: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/state', methods=['GET'])
def get_state():
    session_id = request.args.get('session_id')
    if not session_id or session_id not in sessions:
        return jsonify({"error": "Session not found"}), 404
        
    state = sessions[session_id]
    # Redact full case for client, only send public info
    public_state = {
        "revealed_symptoms": state["revealed_symptoms"],
        "status": state["status"],
        "message_count": len(state["messages"]) // 2
    }
    return jsonify(public_state)

@app.route('/api/end', methods=['POST'])
def end_session():
    data = request.json
    session_id = data.get('session_id')
    
    if session_id not in sessions:
        return jsonify({"message": "Session not found"}), 404
    
    session = sessions[session_id]
    doctor_username = session.get("doctor_username", "")
    
    # Save to doctor's history if logged in
    if doctor_username and doctor_username in doctors:
        from datetime import datetime
        history_entry = {
            "session_id": session_id,
            "patient_name": session["patient_case"].get("name", "Unknown"),
            "disease": session["patient_case"].get("disease", "Unknown"),
            "revealed_symptoms": session["revealed_symptoms"],
            "status": session["status"],
            "chat_history": session.get("chat_history", []),
            "timestamp": datetime.now().isoformat()
        }
        doctors[doctor_username]["history"].append(history_entry)
        print(f"Session saved to {doctor_username}'s history")
    
    del sessions[session_id]
    return jsonify({"message": "Session ended", "saved_to_history": bool(doctor_username)})

@app.route('/api/analyze', methods=['POST'])
def analyze_symptoms():
    """Analyze revealed symptoms using LLM to suggest possible conditions."""
    from agent import get_groq_llm, rotate_api_key, API_KEYS
    from langchain_core.messages import HumanMessage
    
    data = request.json
    symptoms = data.get('symptoms', [])
    
    if not symptoms or len(symptoms) < 1:
        return jsonify({"error": "No symptoms provided"}), 400
    
    # Build prompt for diagnosis analysis
    prompt = f"""You are a medical diagnostic assistant (for educational simulation only).
Given the following symptoms, suggest the top 3 most likely medical conditions.

Symptoms: {', '.join(symptoms)}

Return ONLY a JSON object in this exact format:
{{
    "conditions": [
        {{"name": "Condition Name", "confidence": "High/Medium/Low", "reasoning": "brief explanation"}},
        {{"name": "Condition Name", "confidence": "High/Medium/Low", "reasoning": "brief explanation"}},
        {{"name": "Condition Name", "confidence": "High/Medium/Low", "reasoning": "brief explanation"}}
    ]
}}

IMPORTANT: Return ONLY the JSON, no markdown, no extra text."""

    max_attempts = len(API_KEYS) if API_KEYS else 1
    
    for attempt in range(max_attempts):
        try:
            llm = get_groq_llm(temperature=0.3, model_name="llama-3.1-8b-instant")
            response = llm.invoke([HumanMessage(content=prompt)])
            content = response.content.strip()
            
            # Clean JSON
            if content.startswith("```json"):
                content = content[7:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
            
            result = json.loads(content)
            return jsonify(result)
            
        except Exception as e:
            error_str = str(e).lower()
            print(f"Analyze attempt {attempt + 1} failed: {e}")
            
            if "rate" in error_str or "429" in error_str or "limit" in error_str:
                if rotate_api_key():
                    continue
            break
    
    # Fallback response
    return jsonify({
        "conditions": [
            {"name": "Analysis unavailable", "confidence": "N/A", "reasoning": "API rate limit reached. Try again later."}
        ]
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
