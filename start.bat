@echo off
echo Starting Stock Portfolio App...
echo.
echo Starting backend on http://localhost:8000
start "Backend" cmd /c "cd backend && py main.py"
echo Starting frontend on http://localhost:3000
start "Frontend" cmd /c "cd frontend && npm start"
echo.
echo Both servers starting. The app will open in your browser shortly.
