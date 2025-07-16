console.log("VITE_BACKEND_URL at runtime:", import.meta.env.VITE_BACKEND_URL);
import React, { useEffect, useRef, useState } from "react";
import "./Chat.css";

const CONSENT_KEY = "omani-voicebot-consent";
const BACKEND_URL = `${import.meta.env.VITE_BACKEND_URL}/transcribe`;
const CHAT_URL = `${import.meta.env.VITE_BACKEND_URL}/chat`;

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
  audio?: string; // base64 audio for assistant messages
};

const ConsentModal: React.FC<{ onConsent: () => void }> = ({ onConsent }) => (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(36, 36, 36, 0.65)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2000,
    }}
  >
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        maxWidth: 420,
        width: "90vw",
        padding: "2rem",
        boxShadow: "0 4px 24px #b7d2c2",
        textAlign: "center",
      }}
    >
      <h2 style={{ color: "#23443a", marginBottom: "1rem" }}>Consent Required</h2>
      <p style={{ color: "#23443a", marginBottom: "1.5rem", fontSize: "1.1rem" }}>
        To begin your confidential mental health assessment, we need your consent to record and process your voice. Your data will be handled securely and used only for the purpose of providing you with culturally sensitive, professional support. You may withdraw consent at any time.
      </p>
      <button
        style={{
          background: "#1a8c7a",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          padding: "0.75rem 2rem",
          fontSize: "1.1rem",
          fontWeight: 600,
          cursor: "pointer",
          marginTop: "1rem",
        }}
        onClick={onConsent}
      >
        I Consent
      </button>
    </div>
  </div>
);

const initialMessages: ChatMessage[] = [
  {
    role: "system",
    content: "السلام عليكم ورحمة الله وبركاته - Peace be upon you. I'm your personal mental health assistant, here to provide culturally sensitive support. أنا هنا لأستمع إليك وأفهم مشاعرك (I'm here to listen and understand your feelings). Your privacy is completely protected and our conversation is confidential. كيف حالك اليوم؟ How are you feeling today?",
  },
];

const Chat: React.FC = () => {
  const [consentGiven, setConsentGiven] = useState<boolean>(() => {
    return localStorage.getItem(CONSENT_KEY) === "true";
  });

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  // Recording and transcription state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isLoadingReply, setIsLoadingReply] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);
  const lastAutoPlayedIdx = useRef<number | null>(null);

  useEffect(() => {
    if (consentGiven) {
      localStorage.setItem(CONSENT_KEY, "true");
    }
  }, [consentGiven]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Auto-play ONLY the latest assistant audio when a new assistant message is added
  useEffect(() => {
    const lastAssistantIdx = messages
      .map((msg, idx) => (msg.role === "assistant" && msg.audio ? idx : -1))
      .filter((idx) => idx !== -1)
      .pop();

    if (
      lastAssistantIdx !== undefined &&
      lastAssistantIdx !== null &&
      lastAssistantIdx !== lastAutoPlayedIdx.current
    ) {
      // Pause all other audios
      audioRefs.current.forEach((audio, idx) => {
        if (audio) {
          if (idx === lastAssistantIdx) {
            audio.play().catch(() => {});
          } else {
            audio.pause();
            audio.currentTime = 0;
          }
        }
      });
      lastAutoPlayedIdx.current = lastAssistantIdx;
    }
  }, [messages]);

  // Start recording
  const handleStartRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new window.MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Only create audioBlob and upload if there is data
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

          if (audioBlob.size > 0) {
            try {
              // 1. Transcribe audio
              const formData = new FormData();
              formData.append("audio", audioBlob, "audio/webm");

              const response = await fetch(BACKEND_URL, {
                method: "POST",
                body: formData,
              });

              if (!response.ok) {
                throw new Error("Transcription failed.");
              }

              const data = await response.json();
              const userText =
                (data.transcription && data.transcription.trim() !== "")
                  ? data.transcription
                  : "No transcription result.";

              // 2. Add user message to chat
              setMessages((prev) => [
                ...prev,
                { role: "user", content: userText },
              ]);
              setIsTranscribing(false);

              // 3. Send chat history and user input to backend for OpenAI reply
              setIsLoadingReply(true);
              // Only send {role, content} to backend (strip out audio and other fields)
              const chatHistory = [
                ...messages
                  .filter((msg) => msg.role !== "system")
                  .map((msg) => ({ role: msg.role, content: msg.content })),
                { role: "user", content: userText },
              ];
              const chatRes = await fetch(CHAT_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  history: chatHistory,
                  user: userText,
                }),
              });

              if (!chatRes.ok) {
                throw new Error("Failed to get assistant response.");
              }

              const chatData = await chatRes.json();
              const assistantText =
                (chatData.reply && chatData.reply.trim() !== "")
                  ? chatData.reply
                  : "No assistant response.";
              const audioBase64 = chatData.audio || "";

              setMessages((prev) => [
                ...prev,
                {
                  role: "assistant",
                  content: assistantText,
                  audio: audioBase64
                    ? `data:audio/mp3;base64,${audioBase64}`
                    : undefined,
                },
              ]);
            } catch (err) {
              setError("Transcription or assistant response failed. Please try again.");
            } finally {
              setIsLoadingReply(false);
            }
          } else {
            setError("No audio data captured.");
            setIsTranscribing(false);
          }
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Microphone access denied or not available.");
    }
  };

  // Stop recording and transcribe, then send to OpenAI
  const handleSend = async () => {
    if (isRecording && mediaRecorderRef.current) {
      setIsRecording(false);
      setIsTranscribing(true);
      setError(null);

      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div className="chat-bg">
      {!consentGiven && <ConsentModal onConsent={() => setConsentGiven(true)} />}
      <div className="chat-main">
        {/* Branding */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            background: "transparent",
            borderRadius: "10px",
            boxShadow: "none",
            padding: "0.75rem 0.5rem",
            minHeight: "unset",
            marginBottom: "1.2rem",
            maxWidth: 700,
            marginLeft: "auto",
            marginRight: "auto"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
              <span role="img" aria-label="dove" style={{ fontSize: "1.3rem", color: "#1a8c7a" }}>🕊️</span>
              <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "#1a8c7a", letterSpacing: "0.5px", fontFamily: "inherit" }}>
                Mental Health Companion
              </span>
            </div>
            <span style={{
              fontSize: "0.92rem",
              color: "#23443a",
              fontWeight: 400,
              lineHeight: 1.3,
              fontFamily: "inherit"
            }}>
              Culturally Sensitive AI Support for Omani Arabic Speakers
            </span>
          </div>
        </div>
        {/* Chat area */}
        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`chat-bubble-row ${msg.role}`}
            >
              {(msg.role === "system" || msg.role === "assistant") && (
                <div className="chat-avatar">
                  <span role="img" aria-label="assistant">🕊️</span>
                </div>
              )}
              <div
                className={`chat-bubble ${msg.role}`}
              >
                {msg.content}
                {msg.role === "assistant" && msg.audio && (
                  <audio
                    ref={(el) => {
                      audioRefs.current[idx] = el;
                    }}
                    src={msg.audio}
                    controls
                    style={{ marginTop: 8, width: "100%" }}
                  />
                )}
              </div>
              {msg.role === "user" && (
                <div className="chat-avatar">
                  <span role="img" aria-label="user">👤</span>
                </div>
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        {/* Input area at the bottom */}
        {/* Input area at the bottom */}
        <div className="chat-input-bar">
          <div className="chat-input-inner">
            {/* Microphone button */}
            <button
              className={`chat-mic-btn${isRecording ? " recording" : ""}`}
              disabled={!consentGiven || isRecording}
              onClick={handleStartRecording}
            >
              <span role="img" aria-label="mic">
                🎤
              </span>
              {isRecording && (
                <span
                  style={{
                    position: "absolute",
                    top: -10,
                    right: -10,
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: "#e74c3c",
                    animation: "blinker 1s linear infinite",
                    boxShadow: "0 0 8px #e74c3c",
                    display: "inline-block",
                  }}
                />
              )}
            </button>
            <style>
              {`
                @keyframes blinker {
                  50% { opacity: 0.2; }
                }
              `}
            </style>
            <input
              type="text"
              placeholder="Press on the mic to record..."
              disabled
            />
            {/* Send button */}
            <button
              className={`chat-send-btn-rect${isRecording ? " active" : ""}`}
              disabled={!isRecording}
              onClick={handleSend}
              style={{
                marginLeft: "0.5rem",
                padding: "0.32rem 1.1rem",
                borderRadius: "7px",
                border: "none",
                fontWeight: 600,
                fontSize: "0.98rem",
                background: isRecording ? "#1a8c7a" : "#b7d2c2",
                color: "#fff",
                opacity: isRecording ? 1 : 0.6,
                cursor: isRecording ? "pointer" : "not-allowed",
                transition: "background 0.2s, opacity 0.2s"
              }}
            >
              Send
            </button>
          </div>
        </div>
        {/* Recording/Transcription status */}
        <div className="chat-status-bar">
          {isRecording && (
            <span style={{ color: "#e74c3c", fontWeight: 500 }}>
              <span style={{ marginRight: 8, fontSize: 18 }}>●</span>Recording...
            </span>
          )}
          {isTranscribing && (
            <span style={{ color: "#1a8c7a", fontWeight: 500 }}>
              Transcribing...
            </span>
          )}
          {isLoadingReply && (
            <span style={{ color: "#1a8c7a", fontWeight: 500 }}>
              Generating response...
            </span>
          )}
          {error && (
            <span style={{ color: "#e74c3c", fontWeight: 500 }}>
              {error}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
