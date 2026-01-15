@echo off
echo Starting AI Patient Simulator...

start "Backend API" cmd /k "cd api && python -m venv venv && call venv\Scripts\activate && pip install -r requirements.txt && python app.py"
timeout /t 5
start "Frontend Client" cmd /k "cd frontend && npm install --no-bin-links --ignore-scripts && node node_modules/vite/bin/vite.js"

echo Application launching... Frontend will be at http://localhost:5173
echo Ensure you have set your GROQ_API_KEY in api/.env!
pause
