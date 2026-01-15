import os
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

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "Backend is running"})

@app.route('/start', methods=['POST'])
def start_session():
    # Generate a patient case
    try:
        patient_case = generate_patient_case()
    except Exception as e:
        return jsonify({"error": f"Failed to generate case: {str(e)}"}), 500

    session_id = str(os.urandom(16).hex())
    
    # Initialize state
    sessions[session_id] = {
        "session_id": session_id,
        "patient_case": patient_case,
        "revealed_symptoms": [],
        "asked_questions": [],
        "treatment_given": [],
        "status": "active",
        "messages": []
    }
    
    # Return minimal info to frontend (hide internal case details)
    return jsonify({
        "session_id": session_id,
        "patient": {
            "age_range": patient_case.get("age_range", "Unknown"),
            "sex": patient_case.get("sex", "Unknown"),
            "initial_brief": patient_case.get("presenting_summary", "I need to see a doctor."),
            "disease": patient_case.get("disease"),
            "correct_treatments": patient_case.get("correct_treatments")
        }
    })

@app.route('/message', methods=['POST'])
def message():
    data = request.json
    session_id = data.get("session_id")
    user_msg = data.get("message")
    
    if not session_id or session_id not in sessions:
        return jsonify({"error": "Invalid session"}), 401
    
    state = sessions[session_id]
    
    # Process turn
    result = process_turn(state, user_msg)
    
    # Update state
    reply = result["reply"]
    metadata = result["metadata"]
    
    state["messages"].extend(result["history_update"])
    
    if "revealed" in metadata:
        for sym in metadata["revealed"]:
            if sym not in state["revealed_symptoms"]:
                state["revealed_symptoms"].append(sym)
                
    if "status" in metadata:
        state["status"] = metadata["status"]
        
    return jsonify({
        "reply": reply,
        "state_summary": {
            "status": state["status"],
            "revealed_symptoms": state["revealed_symptoms"],
            "needs_escalation": metadata.get("needs_escalation", False)
        },
        "done": state["status"] in ["resolved", "abandoned"]
    })

@app.route('/state', methods=['GET'])
def get_state():
    session_id = request.args.get("session_id")
    if not session_id or session_id not in sessions:
        return jsonify({"error": "Invalid session"}), 401
    
    state = sessions[session_id]
    return jsonify({
        "session_id": session_id,
        "revealed_symptoms": state["revealed_symptoms"],
        "status": state["status"],
        "age_range": state["patient_case"].get("age_range"),
        "sex": state["patient_case"].get("sex"),
        # Debug info for testing
        "correct_treatments": state["patient_case"].get("correct_treatments", []),
        "disease": state["patient_case"].get("disease", "Unknown")
    })

@app.route('/end', methods=['POST'])
def end_session():
    data = request.json
    session_id = data.get("session_id")
    if session_id in sessions:
        del sessions[session_id]
    return jsonify({"status": "ended"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
