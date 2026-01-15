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

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "Backend is running"})

@app.route('/api/start', methods=['POST'])
def start_session():
    # ... (existing code)

@app.route('/api/message', methods=['POST'])
def message():
    # ... (existing code)

@app.route('/api/state', methods=['GET'])
def get_state():
    # ... (existing code)

@app.route('/api/end', methods=['POST'])
def end_session():
    # ... (existing code)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
