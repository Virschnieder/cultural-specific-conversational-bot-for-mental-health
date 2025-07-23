# LLM Service API Contract

## Endpoint

POST /llm-chat

## Request Body

{
  "history": [
    { "role": "user" | "assistant" | "system", "content": "..." },
    ...
  ],
  "user": "..." // Current user input (string)
}

## Response Body

{
  "reply": "...",                // Final reply to user (string)
  "crisis": true | false,        // Crisis escalation flag (bool)
  "crisis_indicators": [ ... ],  // List of crisis indicators (array of strings)
  "safety_note": "...",          // Optional safety note (string, may be empty)
  "modifications_applied": true | false, // If reply was modified per validator
  "validator_metadata": { ... }  // Raw validator output (object)
}

## Description

- The service will:
  1. Construct the system prompt and chat messages.
  2. Call OpenAI for the main reply.
  3. Call OpenAI for safety validation (with a different prompt and input).
  4. If validator suggests, regenerate reply with modifications.
  5. If crisis detected, escalate with crisis template.
  6. Return all relevant metadata for frontend/backend handling.

- Node.js backend should:
  - Forward chat requests to this service.
  - Use the `reply` and `crisis` fields to determine further actions (e.g., TTS, logging, etc.).
