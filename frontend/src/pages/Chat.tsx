import React, { useEffect, useRef, useState } from "react";

const CONSENT_KEY = "omani-voicebot-consent";
const BACKEND_URL = "http://localhost:5001/transcribe";
const CHAT_URL = "http://localhost:5001/chat";

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
    content: "Peace be upon you. I'm your personal mental health assistant. Together, we'll conduct a confidential and safe assessment of your mental wellbeing.",
  },
  {
    role: "system",
    content: "Welcome to your confidential mental health assessment. I'm here to listen and understand your wellbeing. Your privacy is completely protected. How are you feeling today?",
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
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isLoadingReply, setIsLoadingReply] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);

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

  // Auto-play the latest assistant audio and pause others
  useEffect(() => {
    const lastAssistantIdx = messages
      .map((msg, idx) => (msg.role === "assistant" && msg.audio ? idx : -1))
      .filter((idx) => idx !== -1)
      .pop();

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

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);
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

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);

        if (audioBlob.size > 0) {
          try {
            // 1. Transcribe audio
            const formData = new FormData();
            formData.append("audio", audioBlob, "audio.webm");

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
            const chatHistory = [
              ...messages.filter((msg) => msg.role !== "system"),
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
      };

      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div
      className="chat-container"
      style={{
        width: "100vw",
        minHeight: "100vh",
        background: "#f9faf8",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        position: "relative",
      }}
    >
      {!consentGiven && <ConsentModal onConsent={() => setConsentGiven(true)} />}
      <div
        style={{
          width: "100%",
          maxWidth: 700,
          minHeight: "80vh",
          background: "transparent",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          position: "relative",
        }}
      >
        {/* Chat area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            paddingBottom: "2.5rem",
            marginBottom: "1.5rem",
            minHeight: 400,
            maxHeight: "70vh",
          }}
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent:
                  msg.role === "user"
                    ? "flex-end"
                    : msg.role === "assistant"
                    ? "flex-start"
                    : "flex-start",
                marginBottom: 12,
                alignItems: "flex-end",
              }}
            >
              {msg.role === "system" && (
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "#b7d2c2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 16,
                    flexShrink: 0,
                  }}
                >
                  <span role="img" aria-label="assistant" style={{ fontSize: 24 }}>
                    💼
                  </span>
                </div>
              )}
              <div
                style={{
                  background:
                    msg.role === "user"
                      ? "#e0f7f4"
                      : msg.role === "assistant"
                      ? "#fffbe7"
                      : "#fff",
                  border: "1.5px solid #b7d2c2",
                  borderRadius: 16,
                  padding: "1rem 1.5rem",
                  color: "#23443a",
                  fontSize: "1.1rem",
                  boxShadow: "0 2px 8px #e0eae6",
                  maxWidth: "80%",
                  textAlign: "left",
                  position: "relative",
                }}
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
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        {/* Input area at the bottom */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            border: "1.5px solid #b7d2c2",
            borderRadius: 12,
            background: "#fff",
            padding: "0.5rem 1rem",
            gap: "0.5rem",
            position: "sticky",
            bottom: 0,
            margin: "0 0 1.5rem 0",
            boxShadow: "0 2px 8px #e0eae6",
          }}
        >
          {/* Microphone button */}
          <button
            style={{
              background: isRecording ? "#e74c3c" : "none",
              border: "none",
              color: isRecording ? "#fff" : "#1a8c7a",
              fontSize: "1.5rem",
              marginRight: "0.75rem",
              cursor: "pointer",
              position: "relative",
            }}
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
            placeholder="Or write your own response..."
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: "1rem",
              color: "#23443a",
              background: "transparent",
            }}
            disabled
          />
          {/* Send button */}
          <button
            style={{
              background: isRecording ? "#1a8c7a" : "#b7d2c2",
              border: "none",
              borderRadius: "50%",
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "1.25rem",
              marginLeft: "0.75rem",
              cursor: isRecording ? "pointer" : "not-allowed",
              transition: "background 0.2s",
            }}
            disabled={!isRecording}
            onClick={handleSend}
          >
            <span role="img" aria-label="send">
              📤
            </span>
          </button>
        </div>
        {/* Recording/Transcription status */}
        <div style={{ minHeight: 32, marginTop: 0 }}>
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
