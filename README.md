# Culturally-Specific Conversational Bot for Mental Health

## Overview

A culturally sensitive mental health conversational assistant for Omani Arabic speakers, providing therapeutic-grade support with strict cultural and safety protocols. The system is modular, scalable, and designed for easy local development and deployment.

---

## Architecture

```
+-------------------+         +---------------------+         +-----------------------------+
|    Frontend       |  <--->  |      Backend        |  <--->  |        LLM Service          |
|  (React + Vite)   |  REST   | (Node.js/Express)  |  REST   | (Python/FastAPI + LangChain)|
+-------------------+         +---------------------+         +-----------------------------+
        |                             |                                  |
        |                             |                                  |
        |                             v                                  v
        |                  +-------------------+              +----------------------+
        |                  |  Speech Services  |              |   OpenAI GPT-4o      |
        |                  | (Azure/Google STT |              |   GPT-4-1106-preview |
        |                  |  & Azure TTS)     |              |   (via LangChain)    |
        |                  +-------------------+              +----------------------+
```

### Component Roles

- **Frontend (React + Vite):**  
  Single-page application for user interaction. Handles chat UI, audio recording, and playback. Communicates with the backend via REST APIs.

- **Backend (Node.js/Express):**  
  Orchestrates the system. Handles API endpoints for chat, audio transcription (STT), text-to-speech (TTS), and relays chat requests to the LLM service. Manages integration with external speech services.

- **LLM Service (Python/FastAPI + LangChain):**  
  Handles all LLM logic, including prompt management, safety validation, and cultural adaptation. Uses OpenAI GPT-4o for main conversational intelligence and GPT-4-1106-preview for safety validation and crisis detection.

- **External Services:**  
  - **Azure/Google STT:** Speech-to-text for Omani Arabic.
  - **Azure TTS:** Text-to-speech for Omani Arabic.
  - **OpenAI GPT-4o & GPT-4-1106-preview:** Used for chat and safety validation.

### Data Flow

1. **User** interacts with the frontend (text or audio).
2. **Frontend** sends user input to the backend.
3. **Backend**:
   - For audio: uses Azure/Google STT to transcribe.
   - For chat: relays message to LLM service.
4. **LLM Service** processes the message, applies safety/cultural validation, and generates a response.
   - **Crisis Mechanism:** If a crisis is detected (e.g., suicide, self-harm, violence), the system immediately returns a culturally appropriate crisis message and flags the conversation.
   - **Fallback Mechanism:** If the response needs modification for safety or cultural reasons, the system attempts to regenerate a safer, more appropriate reply.
5. **Backend** (if needed) uses Azure TTS to convert LLM response to audio.
6. **Frontend** displays text and/or plays audio response.

---

## Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Virschnieder/cultural-specific-conversational-bot-for-mental-health.git
   cd cultural-specific-conversational-bot-for-mental-health
   ```

2. **Install dependencies for each service:**
   ```bash
   # Frontend
   cd frontend
   npm install

   # Backend
   cd ../backend
   npm install

   # LLM Service
   cd ../llm_service
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Configuration:**
   - Copy `.env.example` to `.env` in each service directory.
   - Fill in your local values (API keys, URLs, etc.).
   - **Never commit real secrets.** Only `.env.example` should be committed.

---

## Running Locally

Start each service in its own terminal:

```bash
# LLM Service (in llm_service)
source venv/bin/activate
uvicorn llm_service:app --host 0.0.0.0 --port 8000

# Backend (in backend)
npm run dev

# Frontend (in frontend)
npm run dev
```

- The app will be available at [http://localhost:5173](http://localhost:5173) (or another port if in use).

---

## Key Features & Technologies

- **LangChain (Python):** Modular LLM orchestration, prompt management, safety/cultural validation.
- **OpenAI GPT-4o & GPT-4-1106-preview:** Used for chat generation and safety validation, respectively.
- **Crisis and Fallback Mechanisms:** Automatic detection of crisis situations (e.g., suicide, self-harm, violence) with immediate escalation and culturally appropriate messaging. If a response is unsafe or inappropriate, the system attempts to regenerate a safer reply.
- **Azure/Google STT & Azure TTS:** Speech-to-text and text-to-speech for Omani Arabic.
- **Strict environment variable management:** All secrets and URLs are externalized.
- **Easy local development:** Just set up `.env` files and run each service.

---

## Contributing

- Fork the repo and clone locally.
- Copy `.env.example` to `.env` in each service and set your own keys/URLs.
- Submit PRs for improvements, bugfixes, or new features.

---

## License

MIT

---

## Further Documentation

- [Technical Documentation (Notion)](https://illustrious-tiglon-ff6.notion.site/Technical-Documentation-OMANI-Therapist-Voice-Backend-Implementation-2331f686ea6380e4b3cafb825ee099ad?source=copy_link)
- [System Architecture (Notion)](https://illustrious-tiglon-ff6.notion.site/OMANI-Therapist-Voice-System-Design-Model-Integration-Documentatio-2331f686ea6380a185bae2009fc9fe11?source=copy_link)

---

**Questions?**  
Open an issue or discussion on GitHub!
