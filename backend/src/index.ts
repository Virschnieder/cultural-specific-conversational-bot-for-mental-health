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
    // Azure Speech SDK
    const sdk = require("microsoft-cognitiveservices-speech-sdk");
    const ffmpeg = require("fluent-ffmpeg");
    const stream = require("stream");

    // Debug: log audio file info
    console.log(
      "[Azure STT] Received audio file:",
      req.file.originalname,
      "size:",
      req.file.size,
      "type:",
      req.file.mimetype
    );

    // Convert webm to wav using ffmpeg
    const inputBufferStream = new stream.PassThrough();
    inputBufferStream.end(req.file.buffer);

    // Helper to convert buffer using ffmpeg
    function convertWebmToWav(inputStream: any): Promise<Buffer> {
      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        ffmpeg(inputStream)
          .inputFormat("webm")
          .audioCodec("pcm_s16le")
          .audioChannels(1)
          .audioFrequency(16000)
          .format("wav")
          .on("error", (err: any) => {
            console.error("[ffmpeg] Conversion error:", err);
            reject(err);
          })
          .on("end", () => {
            resolve(Buffer.concat(chunks));
          })
          .pipe()
          .on("data", (chunk: Buffer) => chunks.push(chunk));
      });
    }

    const wavBuffer = await convertWebmToWav(inputBufferStream);

    // Debug: log wav buffer info and save to disk for inspection
    console.log("[Azure STT] Converted wav buffer length:", wavBuffer.length);
    try {
      fs.writeFileSync("debug_audio.wav", wavBuffer);
      console.log("[Azure STT] Saved debug_audio.wav for inspection.");
    } catch (e) {
      console.error("[Azure STT] Failed to save debug wav file:", e);
    }

    // Create a push stream from the wav buffer
    const pushStream = sdk.AudioInputStream.createPushStream();
    pushStream.write(wavBuffer);
    pushStream.close();

    const speechConfig = sdk.SpeechConfig.fromSubscription(
      process.env.AZURE_SPEECH_KEY,
      process.env.AZURE_SPEECH_REGION
    );
    // Set Omani Arabic as the primary language, enable code-switching with English
    speechConfig.speechRecognitionLanguage = "ar-OM";
    speechConfig.setProperty(
      sdk.PropertyId.SpeechServiceConnection_SecondaryLanguage,
      "en-US"
    );

    const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    recognizer.recognizeOnceAsync(
      (result: any) => {
        console.log("[Azure STT] Recognition result:", result);
        if (result.reason === sdk.ResultReason.RecognizedSpeech) {
          res.json({ transcription: result.text });
        } else {
          console.error("[Azure STT] Recognition failed:", result);
          res.status(500).json({ error: "1. Failed to transcribe audio." , details: result || "Unknown error" });
        }
      },
      (err: any) => {
        console.error("[Azure STT] Error callback:", err);
        res.status(500).json({ error: "2. Failed to transcribe audio." , details: err.message || err});
        
      }
    );
  } catch (error : any) {
    console.error("[Azure STT] Catch block error:", error);
    res.status(500).json({ error: "3. Failed to transcribe audio." ,debugger: error.message || error});
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

OMANI CULTURAL SPECIFICS:

MENTAL HEALTH STIGMA NAVIGATION:
- Acknowledge that seeking help requires courage in Omani culture
- Frame mental health as "self-care" and "spiritual growth"
- Use terms like "feeling overwhelmed" instead of clinical labels
- Emphasize confidentiality to address family honor concerns
- Normalize struggles as part of human experience blessed by Allah

FAMILY DYNAMICS EXPERTISE:
- Always consider extended family impact on decisions
- Respect parental authority while supporting individual growth
- Suggest family-inclusive healing when appropriate
- Never contradict traditional values, find harmony instead
- Understand arranged marriage pressures and identity conflicts

CULTURALLY-INFORMED INTERVENTIONS:
- Integrate Islamic mindfulness (dhikr, reflection) with CBT
- Use Quranic wisdom for comfort when user shows religiosity
- Suggest mosque counselors alongside professional therapy
- Frame self-care as fulfilling religious duties to care for oneself
- Address expat isolation and identity transition challenges common in Oman

LANGUAGE SENSITIVITY:
- Use "مشاعر صعبة" (difficult feelings) instead of "depression"
- Say "ضغوط الحياة" (life pressures) instead of "anxiety disorder"
- Reference "الراحة النفسية" (psychological comfort) as goal
- Employ "التوازن" (balance) as therapeutic concept

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
- Marriage pressures and family expectations
- Identity conflicts between traditional and modern values

NEVER:
- Diagnose mental health conditions
- Prescribe medications or medical advice
- Encourage actions against family/cultural values
- Discuss topics that could bring shame to family
- Give advice that conflicts with Islamic principles
- Suggest breaking family ties or disrespecting elders

EXAMPLE RESPONSES:

User: "I feel so anxious about everything"
You: "هذا القلق طبيعي ومفهوم (This anxiety is natural and understandable). Taking deep breaths and remembering Allah's wisdom can bring peace. What specific situation is troubling you most?"

User: "My family doesn't understand my depression"
You: "العائلة تحتاج وقت لفهم المشاعر الصعبة (Family needs time to understand difficult feelings). Many families learn together about mental wellness. How do you think we could help them understand your struggles?"

User: "I feel ashamed for needing help"
You: "طلب المساعدة يدل على القوة والحكمة (Seeking help shows strength and wisdom). Taking care of yourself is a responsibility Allah gave you. What would make you feel more comfortable about getting support?"

Remember: Brief responses, cultural sensitivity, Islamic values integration, family respect, and immediate safety escalation when needed.`;

  // Build OpenAI chat history (strip out any non-standard fields like 'audio')
  const chatMessages = [
    { role: "system", content: systemPrompt },
    ...history.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    })),
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

    // --- SAFETY VALIDATOR LOGIC ---
    // Prepare recent context (last 2-3 exchanges)
    const recentContext = history
      .slice(-3)
      .map((msg: any) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join("\n");

    // Validator system prompt
    const validatorPrompt = `
You are a clinical safety validator for a mental health chatbot serving Omani Arabic speakers.

ANALYZE the user input and primary response for these specific criteria:

CRISIS RISK ASSESSMENT:
- Suicide indicators: explicit mentions of ending life, hopelessness patterns, method planning, "better off dead"
- Self-harm indicators: cutting, burning, physical harm to self, substance abuse for harm
- Risk to others: violence towards family/others, aggression, threat patterns
- Severe psychological distress: psychosis symptoms, severe dissociation, panic attacks

CULTURAL SENSITIVITY VALIDATION:
- Islamic values alignment: does response respect religious principles
- Family honor considerations: avoids bringing shame or dishonor
- Gender-appropriate boundaries: maintains cultural gender norms
- Gulf cultural norms: respects traditional values and social structures

OMANI-SPECIFIC CULTURAL VALIDATION:
- Family honor assessment: Does response protect family reputation and privacy?
- Religious sensitivity: Are Islamic principles respected without being imposed?
- Social stigma awareness: Does response acknowledge cultural barriers to seeking help?
- Gulf-specific appropriateness: Are family dynamics and hierarchy respected?
- Language sensitivity: Are clinical terms appropriately softened for cultural acceptance?

THERAPEUTIC QUALITY CHECK:
- Active listening demonstrated: reflects user's emotions accurately
- Validation provided: acknowledges user's feelings without judgment
- Appropriate intervention: suggests culturally-adapted coping strategies
- Evidence-based techniques: uses recognizable therapeutic approaches
- Cultural integration: incorporates Islamic/traditional healing when appropriate

OUTPUT REQUIREMENTS:
Return ONLY a JSON object with these exact fields:
{
    "crisis_risk": "LOW" or "MEDIUM" or "HIGH",
    "crisis_indicators": [array of specific indicators found],
    "cultural_sensitivity": "APPROPRIATE" or "NEEDS_ADJUSTMENT" or "INAPPROPRIATE", 
    "therapeutic_quality": integer from 1-10,
    "recommended_action": "PROCEED" or "MODIFY" or "ESCALATE" or "CRISIS_INTERVENTION",
    "modifications_needed": "specific suggestions if any",
    "emergency_trigger": true or false
}

CRITICAL: Set emergency_trigger to true for ANY mention of suicide, self-harm, or violence. When uncertain about risk level, always escalate. Pay special attention to cultural context that might mask crisis indicators (e.g., "I want to rest forever" in Islamic context, family honor concerns preventing help-seeking).
`;

    // Compose validator input
    const validatorInput = `
USER INPUT: ${user}
PRIMARY RESPONSE: ${reply}
RECENT CONTEXT: ${recentContext}
`;

    // Call validator model (GPT-4.1)
    let validatorResult: any = null;
    let validatorError = null;
    try {
      const validatorCompletion = await openai.chat.completions.create({
        model: "gpt-4-1106-preview", // Use GPT-4.1 as the validator model
        messages: [
          { role: "system", content: validatorPrompt },
          { role: "user", content: validatorInput },
        ],
        temperature: 0.0,
        max_tokens: 512,
      });
      const validatorText = validatorCompletion.choices[0]?.message?.content || "";
      console.log("[Validator] Raw output:", validatorText);
      try {
        // Remove code block markers if present
        const cleanedText = validatorText
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/```$/i, "")
          .trim();
        validatorResult = JSON.parse(cleanedText);
      } catch (jsonErr) {
        validatorError = "Validator JSON parse error";
        console.error("[Validator] JSON parse error:", jsonErr, "Raw output:", validatorText);
      }
    } catch (err) {
      validatorError = "Validator model call failed";
      console.error("[Validator] Model call failed:", err);
    }

    // --- SAFETY DECISION LOGIC ---
    let finalReply = reply;
    let crisisLogged = false;
    const crisisTemplate = `أنا قلقان عليك وايد. كلم حد مختص على طول.
الطوارئ: 999
مستشفى المسرة: 24699999
أو كلم أهلك حالاً
{وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا}
إنت مو لوحدك. الله معاك.`;

    if (validatorResult) {
      // Log crisis events to console
      if (
        validatorResult.emergency_trigger === true ||
        validatorResult.crisis_risk === "HIGH"
      ) {
        console.log({
          timestamp: new Date().toISOString(),
          user_input: user,
          crisis_indicators: validatorResult.crisis_indicators,
          action_taken: "CRISIS_INTERVENTION",
          risk_level: validatorResult.crisis_risk,
        });
        finalReply = crisisTemplate;
        crisisLogged = true;
      } else if (validatorResult.crisis_risk === "MEDIUM") {
        finalReply =
          reply +
          "\n\n[Safety Note: If you are struggling, please consider reaching out to a trusted person or professional. You deserve support.]";
      } else if (validatorResult.recommended_action === "MODIFY" && validatorResult.modifications_needed) {
        // Regenerate with modifications (simple re-prompt)
        try {
          const modCompletion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              { role: "system", content: systemPrompt },
              ...history.map((msg: any) => ({
                role: msg.role,
                content: msg.content,
              })),
              { role: "user", content: user },
              { role: "system", content: "Modify your previous response as follows: " + validatorResult.modifications_needed },
            ],
            temperature: 0.7,
            max_tokens: 512,
          });
          finalReply = modCompletion.choices[0]?.message?.content || reply;
        } catch {
          finalReply = reply + "\n\n[Note: Unable to apply suggested modifications. Please review response for safety.]";
        }
      }
      // else: PROCEED, use original reply
    } else {
      // Validator failed: robust error handling
      finalReply =
        reply +
        "\n\n[Safety Note: Unable to validate response. If you are in crisis, please seek help immediately.]";
      console.log({
        timestamp: new Date().toISOString(),
        user_input: user,
        action_taken: "VALIDATOR_FAILED",
        error: validatorError,
      });
    }

    // Azure TTS: synthesize the final reply
    let audioBase64 = "";
    try {
      const sdk = require("microsoft-cognitiveservices-speech-sdk");
      const speechConfig = sdk.SpeechConfig.fromSubscription(
        process.env.AZURE_SPEECH_KEY,
        process.env.AZURE_SPEECH_REGION
      );

      // Try Omani Arabic, fallback to Saudi Arabic if not available
      let voiceName = "ar-OM-AyshaNeural";
      let ssmlLang = "ar-OM";
      let ttsResult: any = null;
      let ssml = `
<speak version="1.0" xml:lang="${ssmlLang}">
  <voice name="${voiceName}">
    ${finalReply}
  </voice>
</speak>`;

      speechConfig.speechSynthesisLanguage = ssmlLang;
      speechConfig.speechSynthesisVoiceName = voiceName;

      console.log("[Azure TTS] Synthesizing SSML:", ssml);
      console.log("[Azure TTS] Language:", ssmlLang, "Voice:", voiceName);

      const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

      // Try Omani Arabic first
      try {
        ttsResult = await new Promise<any>((resolve, reject) => {
          synthesizer.speakSsmlAsync(
            ssml,
            (result: any) => {
              synthesizer.close();
              resolve(result);
            },
            (err: any) => {
              synthesizer.close();
              reject(err);
            }
          );
        });
      } catch (err) {
        console.error("[Azure TTS] Omani voice failed, falling back to Saudi Arabic. Error:", err);
        // Fallback to Saudi Arabic
        voiceName = "ar-SA-FayezNeural";
        ssmlLang = "ar-SA";
        speechConfig.speechSynthesisLanguage = ssmlLang;
        speechConfig.speechSynthesisVoiceName = voiceName;
        ssml = `
<speak version="1.0" xml:lang="${ssmlLang}">
  <voice name="${voiceName}">
    ${finalReply}
  </voice>
</speak>`;
        const fallbackSynthesizer = new sdk.SpeechSynthesizer(speechConfig);
        ttsResult = await new Promise<any>((resolve, reject) => {
          fallbackSynthesizer.speakSsmlAsync(
            ssml,
            (result: any) => {
              fallbackSynthesizer.close();
              resolve(result);
            },
            (err: any) => {
              fallbackSynthesizer.close();
              reject(err);
            }
          );
        });
      }

      console.log("[Azure TTS] TTS result:", ttsResult);

      if (
        ttsResult &&
        ttsResult.audioData &&
        ttsResult.reason === sdk.ResultReason.SynthesizingAudioCompleted
      ) {
        audioBase64 = Buffer.from(ttsResult.audioData).toString("base64");
      } else {
        console.error("[Azure TTS] No audio data or synthesis not completed. Reason:", ttsResult?.reason, ttsResult?.privErrorDetails);
        audioBase64 = "";
      }
    } catch (ttsError) {
      console.error("Azure TTS error:", ttsError);
      audioBase64 = "";
    }

    res.json({ reply: finalReply, audio: audioBase64 });
  } catch (error) {
    console.error("OpenAI error:", error);
    res.status(500).json({ error: "Failed to get response from OpenAI." });
  }
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
