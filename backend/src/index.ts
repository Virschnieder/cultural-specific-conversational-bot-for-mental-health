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

  // Call Python LLM microservice
  try {
    const fetch = (await import("node-fetch")).default;
    const llmServiceUrl = process.env.LLM_SERVICE_URL || "http://localhost:8000/llm-chat";
    const llmResponse = await fetch(llmServiceUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history, user }),
    });

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      throw new Error(`LLM service error: ${llmResponse.status} ${errorText}`);
    }

    const llmData: any = await llmResponse.json();

    // Use the reply and crisis fields from the Python service
    let finalReply = llmData.reply || "";
    let audioBase64 = "";

    // Azure TTS: synthesize the final reply (unchanged)
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

      if (
        ttsResult &&
        ttsResult.audioData &&
        ttsResult.reason === sdk.ResultReason.SynthesizingAudioCompleted
      ) {
        audioBase64 = Buffer.from(ttsResult.audioData).toString("base64");
      } else {
        audioBase64 = "";
      }
    } catch (ttsError) {
      audioBase64 = "";
    }

    res.json({ reply: finalReply, audio: audioBase64, crisis: llmData.crisis, safety_note: llmData.safety_note, validator_metadata: llmData.validator_metadata });
  } catch (error: any) {
    console.error("LLM service error:", error);
    res.status(500).json({ error: "Failed to get response from LLM service.", details: error.message || error });
  }
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
