# 🚀 EduVerse AI: The Future of Adaptive Learning

<div align="center">
  <img src="../assets/home.png" alt="EduVerse AI Home" width="100%">
  <br/>
  <p><b>A multi-agent, personalized AI learning platform powered by Google Gemini 2.5 Flash</b></p>
</div>

<div align="center">
  <img src="../assets/fullpage.png" alt="EduVerse AI Home" width="100%">
</div>

## 🌟 Overview
EduVerse AI transcends traditional Learning Management Systems (LMS). It is a **premium, AI-native adaptive ecosystem** where a coordinated team of four specialized Google Gemini agents (Planner, Tutor, Quiz, and Research) collaborate dynamically. From a single goal entry, the system generates a fully personalized curriculum, interactive study notes, dynamic assessments, and curated external resources.

---

## 🏆 Key Features & Workflows

### 1️⃣ Intelligent Onboarding & Goal Setting
Simply tell the AI what you want to learn, your current skill level, and how much time you have. 
<img src="../assets/onboarding.png" alt="Onboarding" width="80%">

### 2️⃣ Multi-Agent Orchestration
Our architecture utilizes four distinct Gemini Agents that work in sequence to build your universe of knowledge.
<img src="../assets/agentProcess.png" alt="Agent Process" width="80%">

### 3️⃣ Command Center Dashboard
A sleek, glassmorphic dashboard tracking your learning velocity, career readiness, study streaks & best actions.
<img src="../assets/dashboard.png" alt="Dashboard" width="80%">

### 4️⃣ Adaptive Roadmap
Your curriculum isn't static. It adapts based on your quiz performance. Fail a concept, and the Planner agent automatically injects remedial lessons.
<img src="../assets/roadmap.png" alt="Roadmap" width="80%">

### 5️⃣ AI Tutor Console
Engage in real-time SSE-streamed conversations with your context-aware Tutor Agent for deep concept exploration.
<img src="../assets/aitutor.png" alt="AI Tutor" width="80%">

### 6️⃣ Dynamic Assessments
Quizzes are generated on-the-fly based on the lesson's exact study notes.
<img src="../assets/quiz.png" alt="Quiz" width="80%">

### 7️⃣ Curated Resources & Career Paths
The Research Agent scours the web (via Tavily MCP) to find the best external articles, videos, and documentation.
<img src="../assets/resourse.png" alt="Resources" width="80%">

### 8️⃣ Progress Analytics & Insights
Track your learning progress with detailed analytics and insights, including study streaks, best actions, and career readiness.
<img src="../assets/progress.png" alt="Progress" width="80%">

### 9️⃣ Profile Page
Learn About Current Profile & Suggestions 
<img src="../assets/profile.png" alt="Profile" width="80%">

### 🔟 Settings & Profile Managements
Manage your profile, settings, and preferences.
<img src="../assets/settings.png" alt="Settings" width="80%">

---

## ⚙️ Tech Stack
- **Frontend**: Next.js 15, React 19, Tailwind CSS v4, Framer Motion, Recharts, Three.js
- **Backend**: FastAPI (Clean Architecture), SQLite, SQLAlchemy
- **AI/LLM**: Google Gemini 2.5 Flash (`google-genai`)
- **MCP Integrations**: Tavily (Search), YouTube, PDF Extractors

---

## 🚀 Quick Setup & Installation

Follow these precise steps to get EduVerse AI running locally. 

### 1. Clone the Repository
```bash
git clone https://github.com/ripongoswami/kaggle_capstone_project.git
cd kaggle_capstone_project
```

### 2. Environment Variables
Copy the example environment file and add your API keys:
```bash
cp .env.example .env
```
Inside `.env`, configure:
```env
GEMINI_API_KEY=your_gemini_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here

# Set to false for real AI generation (requires API keys above)
# Keep as true to run using mock/demo data for instant evaluation
USE_MOCK_AGENTS=true
```
*(Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/))*

### 3. Start the Backend (FastAPI)
Open a new terminal window:
```bash
cd kaggle_capstone_project/backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
*Note: The backend auto-creates SQLite tables and seeds a demo user (`student@eduverse.ai` / `Password123`) on startup.*

### 4. Start the Frontend (Next.js)
Open another terminal window:
```bash
cd kaggle_capstone_project/frontend
npm install #if this dosent works use "npm install --force"
npm run dev
```

### 5. Access the Platform
Navigate to **[http://localhost:3000](http://localhost:3000)** in your browser!

> **Linux/Mac Shortcut**: You can run both servers simultaneously using: `./scripts/start.sh`

---
*Built with ❤️ for the Kaggle Capstone Project*
