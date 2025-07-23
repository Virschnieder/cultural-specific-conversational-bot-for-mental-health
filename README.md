# Culturally-Specific Conversational Bot for Mental Health

## Project Overview

This project is a culturally sensitive mental health conversational assistant for Omani Arabic speakers. It is designed to provide therapeutic-grade support, with strict cultural and safety protocols, and is built with a modern, modular architecture:

- **Frontend:** React (Vite) SPA for user interaction.
- **Backend:** Node.js/Express API for audio transcription, TTS, and orchestration.
- **LLM Microservice:** Python FastAPI service using [LangChain](https://github.com/langchain-ai/langchain) for all LLM orchestration, safety validation, and cultural logic.

---

## Architecture

```
Frontend (Vite/React)
    |
    v
Backend (Node.js/Express)
    |         \
    v          v
LLM Service   Azure/Google STT, Azure TTS, etc.
(Python/FastAPI + LangChain)
```

- All LLM logic (prompting, safety, cultural validation) is handled in the Python microservice.
- The backend handles audio, TTS, and relays chat requests to the LLM service.
- All endpoints and secrets are managed via environment variables.

---

## Environment Variable Setup

### 1. Frontend

- `.env` (for local dev, **not committed**):
  ```
  VITE_BACKEND_URL=http://localhost:5001
  ```
- `.env.production` (for production build, **not committed**):
  ```
  VITE_BACKEND_URL=https://your-deployed-backend-url
  ```
- `.env.example` (template, **committed**):
  ```
  VITE_BACKEND_URL=http://localhost:5001
  ```

### 2. Backend

- `.env` (for local dev, **not committed**):
  ```
  OPENAI_API_KEY=your-openai-api-key
  AZURE_SPEECH_KEY=your-azure-speech-key
  AZURE_SPEECH_REGION=your-azure-region
  GOOGLE_APPLICATION_CREDENTIALS=path/to/your/google-credentials.json
  LLM_SERVICE_URL=http://localhost:8000/llm-chat
  ```
- `.env.example` (template, **committed**):
  ```
  OPENAI_API_KEY=your-openai-api-key
  AZURE_SPEECH_KEY=your-azure-speech-key
  AZURE_SPEECH_REGION=your-azure-region
  GOOGLE_APPLICATION_CREDENTIALS=path/to/your/google-credentials.json
  LLM_SERVICE_URL=http://localhost:8000/llm-chat
  ```

### 3. LLM Microservice (llm_service)

- `.env` (for local dev, **not committed**):
  ```
  OPENAI_API_KEY=your-openai-api-key
  # SYSTEM_PROMPT=Optional custom system prompt
  ```
- `.env.example` (template, **committed**):
  ```
  OPENAI_API_KEY=your-openai-api-key
  # SYSTEM_PROMPT=Optional custom system prompt
  ```

**Note:** Never commit `.env` or `.env.production` files with real secrets or URLs. Only commit `.env.example` as a template.

---

## Local Development

1. **Clone the repo and install dependencies for each service:**
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

2. **Copy `.env.example` to `.env` in each service and fill in your local values.**

3. **Run all services:**
   ```bash
   # LLM Service (in llm_service)
   source venv/bin/activate
   uvicorn llm_service:app --host 0.0.0.0 --port 8000

   # Backend (in backend)
   npm run dev

   # Frontend (in frontend)
   npm run dev
   ```
<<<<<<< HEAD
=======
   - The app will be available at [http://localhost:5173](http://localhost:5173) (or another port if in use). 
>>>>>>> c6a885a04aae3284e9ceb0cb0fc072f77b019e92

4. **Access the app at** [http://localhost:5173](http://localhost:5173)

---

## Key Features & Technologies

- **LangChain (Python):** Modular LLM orchestration, prompt management, safety/cultural validation.
- **OpenAI GPT-4o:** Main LLM for chat and safety validation.
- **Azure/Google STT & Azure TTS:** Speech-to-text and text-to-speech for Omani Arabic.
- **Strict environment variable management:** All secrets and URLs are externalized.
- **Easy local development:** Just set up `.env` files and run each service.

---

## Contributing

- Fork the repo and clone locally.
- Copy `.env.example` to `.env` in each service and set your own keys/URLs.
- Submit PRs for improvements, bugfixes, or new features.

---

## Deployment

<<<<<<< HEAD
- **Production deployment and Dockerization instructions will be added soon.**
- For cloud deployment, set all environment variables in your CI/CD or cloud platform (never commit secrets).

---

=======
- Here is the complete documentation of this application visit the notion page : https://illustrious-tiglon-ff6.notion.site/Technical-Documentation-OMANI-Therapist-Voice-Backend-Implementation-2331f686ea6380e4b3cafb825ee099ad?source=copy_link
and for the system architecture visit : https://illustrious-tiglon-ff6.notion.site/OMANI-Therapist-Voice-System-Design-Model-Integration-Documentatio-2331f686ea6380a185bae2009fc9fe11?source=copy_link
>>>>>>> c6a885a04aae3284e9ceb0cb0fc072f77b019e92
## License

MIT

---

**Questions?**  
Open an issue or discussion on GitHub!
