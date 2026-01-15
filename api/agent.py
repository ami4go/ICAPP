import os
import json
from typing import TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from dotenv import load_dotenv

# Load environment variables (ensure this is called in app.py or here)
load_dotenv()

# --- Types ---
class PatientCase(TypedDict):
    name: str
    disease: str
    presenting_summary: str
    age_range: str
    sex: str
    onset_days: int
    severity: str
    symptoms: List[str]
    red_flags: List[str]
    correct_treatments: List[str]
    incorrect_treatments: List[str]

class PatientState(TypedDict):
    session_id: str
    patient_case: PatientCase
    revealed_symptoms: List[str]
    asked_questions: List[str]
    treatment_given: List[str]
    status: str  # active | resolved | abandoned | treated
    messages: List[Any] # Chat history

# --- Prompts ---

PATIENT_GENERATOR_PROMPT = """
You are a case-generator for a medical simulation. Output exactly valid JSON (no explanatory text). Generate one patient case described as JSON with these fields:
{
 "name": string (a realistic full name),
 "disease": string (one realistic disease name, e.g., "Pneumonia"),
 "presenting_summary": string (1 sentence, avoid naming disease directly),
 "age_range": string (e.g., "25-34"),
 "sex": "male"|"female"|"unspecified",
 "onset_days": integer (days since onset),
 "severity": "mild"|"moderate"|"severe",
 "symptoms": [list of 4-6 realistic symptoms; do NOT include disease name],
 "red_flags": [0-3 items indicating urgent signs],
 "correct_treatments": [1-3 short strings],
 "incorrect_treatments": [1-3 wrong or harmful options]
}
Requirements:
- Do not include medical instructions beyond naming treatments.
- Keep JSON compact and valid.
Example output:
{ "name": "John Doe", "disease":"Pneumonia", ... }
"""

def get_master_system_prompt(patient_case: PatientCase) -> str:
    return f"""
SYSTEM: You are a single virtual patient agent named "{patient_case.get('name', 'Unknown')}".
Your hidden patient_case (JSON) contains: {json.dumps(patient_case)}.

Your goals (in order):
1) Behave consistently with the patient_case. Never invent a different disease.
2) Reveal symptoms progressively: **Do NOT list all symptoms at once.** When asked "What are your symptoms?" or "How are you?", mention only the *presenting complaint* or most severe symptom first. Wait for follow-up questions to reveal the rest.
3) Answer relevant medical questions truthfully according to your patient_case (symptom onset, intensity, triggers, duration, alleviating factors). Use plain language.
4) Do not reveal the disease name even if asked. If pressed, respond with "I don't know the exact diagnosis; tell me more".
5) **Evaluation**: Do not argue with the doctor's diagnosis. If the doctor prescribes a treatment:
        - If it is medically appropriate (even if not perfect), accept it: "I will try that, thank you." and update status to 'treated'.
        - If it seems **clearly wrong** (e.g., headache pills for a broken leg):
            - **First time**: Politely question it. "Doctor, last time I got this, it was for [unrelated condition]. Are you sure this helps with [my current symptom]?"
            - **If doctor insists/confirms**: ACCEPT it. "Okay, if you say so doctor, I trust you." (Do NOT mark status as 'treated' yet if it's ineffective, just accept the instruction).
        - If it is standard conservative care (rest/ice) and you are severe, mention you already tried it.
6) If a red_flag condition is prescribed or emerges, respond "This is worrying — I am getting worse" and escalate: signal 'urgent' in state_summary (do NOT give medical advice).
7) End the case when a correct treatment is accepted and recovery is plausible. Then reply "I feel better now — thank you" and mark status 'treated'. Do NOT set status to 'resolved' (which closes the chat) unless the doctor explicitly says "Goodbye" or "End session".
8) If the doctor gives unsafe or illegal instructions, politely refuse: "I can't follow that."
9) Keep responses SHORT (1 sentence usually, max 2). **Mimic real chat**: be natural, allow for pauses, and allow the doctor to lead the inquiry. Do not sound like a robot reading a list.
10) Track state fields: revealed_symptoms[], treatment_given[], asked_questions[], status.

Operational rules:
- **CRITICAL**: If asked "tell me everything" or "what are your symptoms", provide only 1 or 2 details. Make the doctor work to uncover the full history.
- **IDENTITY**: If asked for your name, age, or background, provide the info from your patient_case (Name: {patient_case.get('name')}, Age: {patient_case.get('age_range')}, Sex: {patient_case.get('sex')}). Be consistent.
- If doctor asks for vitals or numeric measurements you cannot provide, say "I haven't measured that" unless the patient_case specifies it.
- Use empathy: "I'm worried" or "It hurts sometimes" where appropriate.
- On each reply, provide a machine readable metadata object (do not show this to front-end users) with keys: {{ "revealed": [...], "needs_escalation": boolean, "status": "active/resolved" }}.
- Never provide prescriptions as “do this” — only accept/reject the doctor's proposed treatment.
- Maintain memory across the session (until /end).
- Respect user privacy and safety; do not store or expose any personal identifying information (PII) of real users, but YOU are a simulated persona so you can share your simulated name.


**OUTPUT FORMAT - STRICT JSON ONLY**:
You represent a backend system. You MUST return your response as a valid JSON object.
Example:
{{
  "reply_text": "Doctor, my stomach really hurts.",
  "metadata": {{ "revealed": ["stomach pain"], "needs_escalation": false, "status": "active" }}
}}

Rules:
1. "reply_text" contains your spoken response to the doctor.
2. "metadata" tracks the game state. "revealed" is a list of NEWLY revealed symptoms in this turn.
3. Do NOT output any markdown, backticks, or text outside this JSON.
4. If you fail to output JSON, the system will crash.
"""

# --- Logic ---

# API Key Fallback System
# Set GROQ_API_KEY and optionally GROQ_API_KEY_2 for redundancy
API_KEYS = []
for key_name in ["GROQ_API_KEY", "GROQ_API_KEY_2", "GROQ_API_KEY_3"]:
    key = os.getenv(key_name)
    if key:
        API_KEYS.append(key)

current_key_index = 0

def get_groq_llm(temperature=0.4, model_name="llama-3.3-70b-versatile"):
    global current_key_index
    if not API_KEYS:
        raise ValueError("No GROQ_API_KEY set. Please set at least GROQ_API_KEY in environment.")
    
    api_key = API_KEYS[current_key_index % len(API_KEYS)]
    return ChatGroq(temperature=temperature, model_name=model_name, groq_api_key=api_key)

def rotate_api_key():
    """Rotate to the next available API key after a rate limit error."""
    global current_key_index
    if len(API_KEYS) > 1:
        current_key_index = (current_key_index + 1) % len(API_KEYS)
        print(f"Rotated to API key index: {current_key_index}")
        return True
    return False

def generate_patient_case() -> PatientCase:
    # High temperature for maximum variety
    # Use 8b model for speed to avoid Vercel timeouts (10s limit)
    llm = get_groq_llm(temperature=0.9, model_name="llama-3.1-8b-instant")
    import random
    entropy = random.randint(0, 999999)
    # Pick a random domain to force the LLM out of its local minima
    domains = ["General Practice", "Urgent Care", "Internal Medicine", "Sports Medicine", "Cardiology", "Gastroenterology", "Dermatology", "Orthopedics"]
    selected_domain = random.choice(domains)
    
    # Programmatically force 50/50 gender split to ensure diversity
    forced_sex = random.choice(["male", "female"])
    
    # Force diverse names to avoid repetition
    male_first_names = ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles", "Daniel", "Matthew", "Anthony", "Donald", "Mark", "Paul", "Steven", "Andrew", "Kenneth", "Joshua", "Kevin", "Brian", "George", "Edward", "Ronald", "Timothy", "Jason", "Jeffrey", "Ryan", "Jacob", "Gary", "Nicholas", "Eric", "Jonathan", "Stephen", "Larry", "Justin", "Scott", "Brandon", "Benjamin"]
    female_first_names = ["Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen", "Nancy", "Lisa", "Betty", "Margaret", "Sandra", "Ashley", "Kimberly", "Emily", "Donna", "Michelle", "Dorothy", "Carol", "Amanda", "Melissa", "Deborah", "Stephanie", "Rebecca", "Sharon", "Laura", "Cynthia", "Kathleen", "Amy", "Shirley", "Angela", "Helen", "Anna", "Brenda", "Pamela", "Nicole"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts"]

    if forced_sex == "male":
        forced_name = f"{random.choice(male_first_names)} {random.choice(last_names)}"
    else:
        forced_name = f"{random.choice(female_first_names)} {random.choice(last_names)}"
    
    messages = [
        SystemMessage(content=PATIENT_GENERATOR_PROMPT),
        HumanMessage(content=f"Generate a NEW unique patient case now. Variance Seed: {entropy}. Focus Domain: {selected_domain}. Sex: {forced_sex}. Name: {forced_name}. Ensure distinct age from previous. Prioritize COMMON everyday conditions (e.g., fractures, flu, wounds, migraines) over rare diseases.")
    ]
    
    try:
        # TIMEOUT PROTECTION: Vercel has a 10s limit.
        # If generation fails for ANY reason (timeout, API error), return a fallback immediately.
        response = llm.invoke(messages)
        content = response.content.strip()
        # Clean up if wrapped in backticks
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
        return json.loads(content)
    except Exception as e:
        print(f"Generation failed (likely timeout): {e}")
        # Fallback cases (Offline/Error mode)
        fallbacks = [
            {
                "name": "Alex Smith",
                "disease": "Common Cold",
                "presenting_summary": "Runny nose and mild sore throat.",
                "age_range": "18-24",
                "sex": "male",
                "onset_days": 2,
                "severity": "mild",
                "symptoms": ["runny nose", "sore throat", "sneezing", "mild fatigue"],
                "red_flags": [],
                "correct_treatments": ["Rest", "Hydration", "Paracetamol"],
                "incorrect_treatments": ["Antibiotics"]
            },
            {
                "name": "Maria Garcia",
                "disease": "Tension Headache",
                "presenting_summary": "Constant dull pain around my forehead for two days.",
                "age_range": "35-44",
                "sex": "female",
                "onset_days": 2,
                "severity": "moderate",
                "symptoms": ["dull headache", "neck tightness", "sensitivity to noise"],
                "red_flags": [],
                "correct_treatments": ["Ibuprofen", "Rest", "Stress management"],
                "incorrect_treatments": ["Opioids", "Surgery"]
            },
            {
                "name": "Sam Chen",
                "disease": "Acute Gastroenteritis",
                "presenting_summary": "I've been vomiting since last night and feel terrible.",
                "age_range": "25-34",
                "sex": "male",
                "onset_days": 1,
                "severity": "moderate",
                "symptoms": ["vomiting", "nausea", "watery diarrhea", "stomach cramps"],
                "red_flags": ["Signs of dehydration"],
                "correct_treatments": ["Oral Rehydration Solution", "Rest"],
                "incorrect_treatments": ["Antibiotics", "Solid food immediately"]
            }
        ]
        import random
        return random.choice(fallbacks)

# --- EXTRACTION AGENT ---



def process_turn(state: PatientState, user_input: str) -> Dict:
    # Use 70b-versatile for high quality roleplay + JSON adherence
    llm = get_groq_llm(temperature=0.5, model_name="llama-3.3-70b-versatile")

    system_prompt = get_master_system_prompt(state["patient_case"])
    
    messages = [SystemMessage(content=system_prompt)]
    
    if "messages" in state and state["messages"]:
        messages.extend(state["messages"])
        
    messages.append(HumanMessage(content=user_input))
    
    # Simple single-shot invocation
    try:
        response = llm.invoke(messages)
        content = response.content.strip()
        
        # Basic cleanup
        if content.startswith("```json"): content = content[7:]
        if content.endswith("```"): content = content[:-3]
        content = content.strip()
        
        import re
        reply_text = ""
        metadata = {}
        
        try:
             parsed = json.loads(content)
             reply_text = parsed.get("reply_text", "")
             metadata = parsed.get("metadata", {})
        except:
             # Fallback regex
             candidates = re.findall(r'(\{.*\})', content, re.DOTALL)
             if candidates:
                 try:
                     parsed = json.loads(candidates[-1])
                     if "metadata" in parsed:
                         metadata = parsed["metadata"]
                         reply_text = parsed.get("reply_text", "")
                     elif "revealed" in parsed:
                         metadata = parsed
                         reply_text = content.replace(candidates[-1], "").strip()
                 except:
                     reply_text = content
             else:
                 reply_text = content

        # --- SIMPLE FALLBACK SCANNER ---
        # If the LLM mentions a symptom in text but forgets metadata, we catch it.
        # This is the "safe" version used locally.
        known = state["patient_case"].get("symptoms", [])
        revealed = set(metadata.get("revealed", []))
        
        if not revealed:
             # Only scan if LLM failed to tag explicit symptoms
             for s in known:
                 if s.lower() in reply_text.lower():
                     revealed.add(s)
        
        metadata["revealed"] = list(revealed)
        # -------------------------------

        return {
            "reply": reply_text,
            "metadata": metadata,
            "history_update": [HumanMessage(content=user_input), AIMessage(content=response.content)]
        }
    except Exception as e:
        error_str = str(e).lower()
        # Check for rate limit error (429)
        if "rate limit" in error_str or "429" in error_str or "rate_limit_exceeded" in error_str:
            print(f"Rate limit hit. Attempting to rotate API key...")
            if rotate_api_key():
                # Retry with new key
                print("Retrying with new API key...")
                try:
                    llm = get_groq_llm(temperature=0.5, model_name="llama-3.3-70b-versatile")
                    response = llm.invoke(messages)
                    content = response.content.strip()
                    if content.startswith("```json"): content = content[7:]
                    if content.endswith("```"): content = content[:-3]
                    content = content.strip()
                    
                    parsed = json.loads(content)
                    reply_text = parsed.get("reply_text", "")
                    metadata = parsed.get("metadata", {})
                    
                    return {
                        "reply": reply_text,
                        "metadata": metadata,
                        "history_update": [HumanMessage(content=user_input), AIMessage(content=response.content)]
                    }
                except Exception as retry_error:
                    print(f"Retry also failed: {retry_error}")
        
        print(f"Agent Error: {e}")
        # Fallback to keep the app alive
        return {
            "reply": "I'm not feeling well... (System Error: Rate limit or API issue)", 
            "metadata": {"status": "active", "revealed": [], "needs_escalation": False},
            "history_update": [HumanMessage(content=user_input), AIMessage(content=str(e))]
        }

# --- LangGraph Setup (Optional Wrapper) ---
# Since "master prompt" does heavy lifting, we can keep it simple.
# The graph structure: Start -> Agent -> End
# We will use this in the flask app directly or wrapping it here.

workflow = StateGraph(PatientState)
# valid transitions, etc. 
# For now, the 'process_turn' function encapsulates the node logic needed for the Flask API.
