# Culturally-Specific Conversational Bot for Mental Health

## Overview

A culturally sensitive mental health conversational assistant for Omani Arabic speakers, providing therapeutic-grade support with strict cultural and safety protocols. The system is Dockerized for easy local development and cloud deployment.

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

---

## Component Roles

- **Frontend (React + Vite):**  
  Single-page application for user interaction. Handles chat UI, audio recording, and playback. Communicates with the backend via REST APIs.

- **Backend (Node.js/Express):**  
  Orchestrates the system. Handles API endpoints for chat, audio transcription (STT), text-to-speech (TTS), and relays chat requests to the LLM service. Manages integration with external speech services.

- **LLM Service (Python/FastAPI + LangChain):**  
  Handles all LLM logic, including prompt management, safety validation, and cultural adaptation. Uses OpenAI GPT-4o for main conversational intelligence and GPT-4-1106-preview for safety validation.

- **External Services:**  
  - **Azure/Google STT:** Speech-to-text for Omani Arabic.
  - **Azure TTS:** Text-to-speech for Omani Arabic.
  - **OpenAI GPT-4o & GPT-4-1106-preview:** Used for chat and safety validation.

---

## Data Flow

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

## Local Development (Docker Compose)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Virschnieder/cultural-specific-conversational-bot-for-mental-health.git
   cd cultural-specific-conversational-bot-for-mental-health
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env` in each of `backend/`, `frontend/`, and `llm_service/`.
   - Fill in your local values (API keys, URLs, etc.).

3. **Start all services:**
   ```bash
   docker compose up --build
   ```
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend: [http://localhost:5001](http://localhost:5001)
   - LLM Service: [http://localhost:8000](http://localhost:8000)

4. **Stop all services:**
   ```bash
   docker compose down
   ```

---

## Environment Variables

- **Frontend:**  
  - `VITE_BACKEND_URL` (set to backend URL at build time)
- **Backend:**  
  - `LLM_SERVICE_URL` (URL to LLM service)
  - `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`, etc.
- **LLM Service:**  
  - `OPENAI_API_KEY`

**Note:**  
- For local dev, use `localhost` URLs.
- For production, the GitHub Actions workflow injects the correct Azure URLs at build time.

---

## CI/CD & Azure Deployment

- **Automated via GitHub Actions:**  
  - See `.github/workflows/dockerized-multiservice-deploy.yml`
  - Builds and pushes Docker images for each service to GitHub Container Registry.
  - Deploys each service to its own Azure Web App for Containers.
  - Sets environment variables in Azure using the Azure CLI.

- **To deploy:**  
  1. Push to the `main` branch.
  2. The workflow will build, push, and deploy all services.
  3. Environment variables are set automatically in Azure.

---

## Key Features & Technologies

- **LangChain (Python):** Modular LLM orchestration, prompt management, safety/cultural validation.
- **OpenAI GPT-4o & GPT-4-1106-preview:** Used for chat generation and safety validation.
- **Azure/Google STT & Azure TTS:** Speech-to-text and text-to-speech for Omani Arabic.
- **Strict environment variable management:** All secrets and URLs are externalized.
- **Easy local development and cloud deployment with Docker.**

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
