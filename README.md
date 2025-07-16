# Omani Arabic Mental Health Voice Chatbot

A culturally sensitive, voice-only mental health support chatbot for Omani Arabic speakers. This web application provides therapeutic-grade, real-time conversational support using speech-to-text, GPT-4o, and text-to-speech technologies.

## Features

- Voice-only chat interface (React + TypeScript + Vite)
- Real-time speech-to-text (Azure STT)
- Dual-model response generation (OpenAI GPT-4o, GPT-4.1 fallback)
- Culturally adapted, therapeutic-grade responses
- Text-to-speech (Azure TTS) with auto-play and replay controls
- No database required—chat history is managed in the browser
- Full compliance with privacy and safety protocols

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Backend:** Node.js, Express, TypeScript
- **APIs:** Azure Speech-to-Text, Azure Text-to-Speech, OpenAI GPT-4o, GPT-4.1 (validator)
- **Other:** Multer (audio upload), dotenv (env management)

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Virschnieder/cultural-specific-conversational-bot-for-mental-health.git
   cd omani-therapist-voice
   ```

2. **Install dependencies:**
   ```bash
   cd backend
   npm install
   cd ../frontend
   npm install
   ```

3. **Set up environment variables:**
   - Copy `.env.example` to `.env` in both `backend/` and `frontend/` if provided.
   - For backend, set:
     ```
     AZURE_SPEECH_KEY=your-azure-speech-key
     AZURE_SPEECH_REGION=your-azure-region
     OPENAI_API_KEY=your-openai-api-key
     ```

4. **Run the backend:**
   ```bash
   cd backend
   npm run dev
   ```

5. **Run the frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
   - The app will be available at [http://localhost:5173](http://localhost:5173) (or another port if in use).

## Usage

- Click "Begin Assessment" to start a session.
- Give consent to record audio.
- Use the microphone to speak; your speech will be transcribed and sent to the AI.
- The assistant's response will be shown as text and played as audio (with pause/replay controls).

## Environment Variables

- `AZURE_SPEECH_KEY`: Your Azure Speech resource key.
- `AZURE_SPEECH_REGION`: Your Azure Speech region (e.g., `uaenorth`).
- `OPENAI_API_KEY`: Your OpenAI API key.

## Project Structure

- `frontend/`: React app (UI, chat logic)
- `backend/`: Node.js/Express API (STT, TTS, OpenAI integration)
- `Keys/`: (Not committed) Place your credentials here if needed.

## Documentation & Context

- For full technical details, system prompts, and architecture, see [CONTEXT.md](CONTEXT.md).

## License

MIT

---
