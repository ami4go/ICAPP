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

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "Backend is running"})

@app.route('/api/start', methods=['POST'])
def start_session():
    try:
        # Generate a new patient case (uses 8b instant for speed + fallback safety)
        patient_case = generate_patient_case()
        
        session_id = str(uuid.uuid4())
        
        # Initialize session state
        sessions[session_id] = {
            "session_id": session_id,
            "patient_case": patient_case,
            "revealed_symptoms": [],
            "asked_questions": [],
            "treatment_given": [],
            "status": "active",
            "messages": []
        }
        
        return jsonify({
            "session_id": session_id, 
            "message": "Session started",
            "patient_summary": patient_case["presenting_summary"] # Only reveal summary initially
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
                
        # Persist (in-memory)
        sessions[session_id] = state
        
        return jsonify({
            "reply": result["reply"],
            "metadata": result.get("metadata", {}),
            "state_summary": {
                "revealed_count": len(state["revealed_symptoms"]),
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
    if session_id in sessions:
        del sessions[session_id]
        return jsonify({"message": "Session ended"})
    return jsonify({"message": "Session not found"}), 404

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
