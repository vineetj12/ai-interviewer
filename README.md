# 🤖 AI Placement Interviewer

An intelligent backend service that analyzes a user's resume and interview responses to simulate a real interview environment. It uses Google Gemini Pro to evaluate the candidate’s communication skills, emotional state, and resume strength.

## 🚀 Features

- 🧠 Generates AI interview questions based on user resume
- 📄 Analyzes resume and gives a score
- 💬 Highlights strengths and weaknesses in the resume
- 📈 Evaluates communication skills using voice-to-text
- 😰 Predicts nervousness based on text and emotion analysis

## 🛠️ Tech Stack

- **Node.js & Express.js** — Backend API
- **Google Generative AI (Gemini Pro)** — AI analysis and feedback
- **Multer** — File upload handling (for resumes)
- **OpenAI Whisper / Other API (optional)** — For voice transcription
- **Frontend (optional)** — Not included here, but easily integrable with React/Next.js

---


---

## 🔑 Setup & Installation

1. **Clone the repo**

```bash
git clone https://github.com/your-username/ai-placement-interviewer.git
cd ai-placement-interviewer
```

2. Install dependencies
``` bash
npm install
```

3. Set up Environment Variables(requires your own gemini api key)
``` bash
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
```

4. Run the server
``` bash
npm start
```
