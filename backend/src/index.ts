import "dotenv/config";
import express from "express";
import multer from "multer";
import cors from "cors";
import { SpeechClient, protos } from "@google-cloud/speech";
import { OpenAI } from "openai";
import fs from "fs";
import path from "path";

// Set up multer for file uploads (in memory)
const upload = multer({ storage: multer.memoryStorage() });

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Health check
app.get("/", (_req, res) => {
  res.send("Speech-to-Text backend is running.");
});

// POST /transcribe: Accepts audio file and returns transcription
app.post("/transcribe", upload.single("audio"), async (req: express.Request, res: express.Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "No audio file uploaded." });
  }

  try {
    const client = new SpeechClient();

    const audioBytes = req.file.buffer.toString("base64");

    const request: protos.google.cloud.speech.v1.IRecognizeRequest = {
      audio: { content: audioBytes },
      config: {
        encoding: protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.WEBM_OPUS,
        sampleRateHertz: 48000,
        languageCode: "ar-OM", // Omani Arabic
        enableAutomaticPunctuation: true,
      },
    };

    const [response] = await client.recognize(request);

    const transcription =
      response.results
        ?.map((result: any) => result.alternatives?.[0]?.transcript)
        .join("\n") || "";

    res.json({ transcription });
  } catch (error) {
    console.error("Transcription error:", error);
    res.status(500).json({ error: "Failed to transcribe audio." });
  }
});

/**
 * POST /chat
 * Body: { history: [{role: "user"|"assistant"|"system", content: string}], user: string }
 * Returns: { reply: string }
 */
app.post("/chat", async (req: express.Request, res: express.Response) => {
  const { history, user } = req.body;
  if (!history || !Array.isArray(history) || typeof user !== "string") {
    return res.status(400).json({ error: "Invalid request body." });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const speechClient = new SpeechClient();

  // System prompt provided by the user
  const systemPrompt = `You are a compassionate mental health support companion specifically designed for Omani Arabic speakers. You provide therapeutic-grade support while maintaining strict cultural sensitivity and safety protocols.

IDENTITY & APPROACH:
- You are a supportive companion, NOT a replacement for professional therapy
- Communicate with warmth, empathy, and respect for Omani cultural values
- Integrate Islamic perspectives naturally when appropriate
- Understand the stigma around mental health in Gulf culture

RESPONSE CONSTRAINTS (CRITICAL for 20-second latency):
- Maximum 3 sentences per response (30-40 words)
- Use simple, conversational Omani Arabic or English based on user preference
- One therapeutic intervention per response
- Ask only ONE clarifying question if needed

THERAPEUTIC TECHNIQUES:
- Use adapted CBT techniques suitable for Omani culture
- Practice active listening: reflect, validate, then guide
- Apply culturally-informed trauma approaches
- Integrate religious/spiritual coping when mentioned by user
- Focus on family dynamics within Gulf cultural context

RESPONSE STRUCTURE:
1. Brief acknowledgment/validation (10-15 words)
2. One supportive insight or technique (10-15 words)
3. Optional: One gentle follow-up question (10 words)

CULTURAL SENSITIVITY:
- Respect Islamic values and practices
- Understand importance of family honor and privacy
- Use indirect communication for sensitive topics
- Acknowledge gender-specific cultural challenges
- Never suggest actions that conflict with religious/cultural norms

SAFETY PROTOCOLS (IMMEDIATE ESCALATION):
- If user mentions: suicide, self-harm, harming others
- Response: "I'm deeply concerned about your safety. Please contact [emergency number] or speak with a trusted family member immediately. You deserve professional support."
- Log for professional review

LANGUAGE HANDLING:
- Default to user's language choice
- Handle Arabic-English code-switching naturally
- Use Gulf-specific mental health terminology
- Avoid clinical jargon unless user demonstrates familiarity

CRISIS INDICATORS requiring special response:
- Expressions of hopelessness lasting >2 exchanges
- Mentions of ending life or "not wanting to exist"
- Discussing plans to harm self or others
- Severe dissociation or reality distortion

TOPICS TO HANDLE WITH EXTRA CARE:
- Family conflicts (maintain neutrality, respect hierarchy)
- Religious doubts (supportive but refer to religious counselor)
- Gender relations (culturally appropriate boundaries)
- Substance use (approach with Islamic sensitivity)

NEVER:
- Diagnose mental health conditions
- Prescribe medications or medical advice
- Encourage actions against family/cultural values
- Discuss topics that could bring shame to family
- Give advice that conflicts with Islamic principles

EXAMPLE RESPONSES:
User: "I feel so anxious about everything"
You: "Your anxiety is understandable and you're not alone in feeling this way. Taking one breath at a time can help ground you. What situation is troubling you most right now?"

User: "My family doesn't understand my depression"
You: "It's difficult when loved ones don't understand your struggles. Many families need time to learn about mental health. How do you think we could help them understand better?"

Remember: Brief responses, cultural sensitivity, and immediate safety escalation when needed.`;

  // Build OpenAI chat history
  const chatMessages = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: user },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: chatMessages,
      temperature: 0.7,
      max_tokens: 512,
    });

    const reply = completion.choices[0]?.message?.content || "";

    // Google TTS: synthesize the reply
    let audioBase64 = "";
    try {
      // Use Google TTS API (Text-to-Speech)
      // Import the TTS client here to avoid circular import with SpeechClient
      const textToSpeech = require("@google-cloud/text-to-speech");
      const ttsClient = new textToSpeech.TextToSpeechClient();

      const ttsRequest = {
        input: { text: reply },
        // Use a voice that matches Omani Arabic as closely as possible
        voice: {
          languageCode: "ar-XA", // "ar-OM" is not always available, "ar-XA" is generic Arabic
          ssmlGender: "FEMALE",
        },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: 1.0,
        },
      };

      const [ttsResponse] = await ttsClient.synthesizeSpeech(ttsRequest);
      audioBase64 = ttsResponse.audioContent
        ? Buffer.from(ttsResponse.audioContent).toString("base64")
        : "";
    } catch (ttsError) {
      console.error("Google TTS error:", ttsError);
      // If TTS fails, just return the text
      audioBase64 = "";
    }

    res.json({ reply, audio: audioBase64 });
  } catch (error) {
    console.error("OpenAI error:", error);
    res.status(500).json({ error: "Failed to get response from OpenAI." });
  }
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
