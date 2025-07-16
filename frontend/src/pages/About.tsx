import React from "react";
import "./About.css";

const aboutCards = [
  {
    icon: "🛡️",
    title: "Complete Anonymity",
    desc: "Your identity remains completely private. No personal information is required or stored.",
    note: "Respecting your privacy is fundamental to building trust"
  },
  {
    icon: "🔒",
    title: "Secure Data Protection",
    desc: "All responses are encrypted and protected with military-grade security protocols.",
    note: "Your confidentiality is our sacred trust"
  },
  {
    icon: "👁️",
    title: "No Judgment Zone",
    desc: "Our assessment is completely non-judgmental and culturally sensitive.",
    note: "Mental health is part of overall wellness, not a weakness"
  },
  {
    icon: "📄",
    title: "Professional Standards",
    desc: "Developed by licensed psychologists with expertise in Middle Eastern mental health.",
    note: "Evidence-based assessment that honors Islamic values"
  }
];

const About: React.FC = () => (
  <div className="about-bg">
    <div className="about-container">
      <div className="about-header-icon">
        <span role="img" aria-label="shield" className="about-header-shield">🛡️</span>
      </div>
      <h1 className="about-title">Your Privacy & Cultural Values Matter</h1>
      <p className="about-subtitle">
        We understand the sensitive nature of mental health in Omani society. Our assessment is<br />
        designed with complete respect for your privacy, cultural values, and Islamic principles.
      </p>
      <div className="about-cards-grid">
        {aboutCards.map((card, idx) => (
          <div className="about-card" key={idx}>
            <div className="about-card-icon">{card.icon}</div>
            <div>
              <div className="about-card-title">{card.title}</div>
              <div className="about-card-desc">{card.desc}</div>
              <div className="about-card-note">{card.note}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default About;
