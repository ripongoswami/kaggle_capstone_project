#!/bin/bash
# EduVerse AI Concurrent Dev Servers Startup script

echo "Starting EduVerse AI Development Environment..."

# 1. Run database initialization checks
python scripts/seed_db.py

# 2. Boot servers
if command -v wt.exe &> /dev/null; then
    # On Windows with Windows Terminal, open separate tabs
    wt.exe nt -d ./backend -p "Command Prompt" cmd /k "uvicorn app.main:app --reload" \; nt -d ./frontend -p "Command Prompt" cmd /k "npm run dev"
else
    # Otherwise run in background
    cd backend && uvicorn app.main:app --reload &
    cd ../frontend && npm run dev &
    wait
fi
