import React from "react";
import "./Resources.css";

const emergencyContacts = [
  {
    title: "Royal Oman Police Emergency Line",
    phone: "9999",
    hours: "24/7",
    arabicSupport: true,
  },
  {
    title: "Oman Mental Health Crisis Line",
    phone: "800-HELP (4357)",
    hours: "24/7",
    arabicSupport: true,
  },
  {
    title: "Ministry of Health Emergency",
    phone: "24699999",
    hours: "24/7",
    arabicSupport: true,
  },
];

const Resources: React.FC = () => (
  <div className="resources-bg">
    <div className="resources-container">
      <h1 className="resources-title">Omani Mental Health Resources</h1>
      <p className="resources-subtitle">
        Comprehensive directory of mental health services across Oman, including<br />
        emergency support, healthcare providers, and community resources
      </p>
      <div className="resources-emergency-section">
        <div className="resources-emergency-header">
          <span className="resources-emergency-icon" role="img" aria-label="warning">⚠️</span>
          <span className="resources-emergency-title">Emergency Mental Health Support</span>
        </div>
        <div className="resources-emergency-desc">
          If you're in immediate crisis, contact these services now
        </div>
        <div className="resources-emergency-cards">
          {emergencyContacts.map((contact, idx) => (
            <div className="resources-emergency-card" key={idx}>
              <div className="resources-emergency-card-title">{contact.title}</div>
              <div className="resources-emergency-card-info">
                <span className="resources-emergency-card-icon" role="img" aria-label="phone">📞</span>
                <span className="resources-emergency-card-phone">{contact.phone}</span>
              </div>
              <div className="resources-emergency-card-info">
                <span className="resources-emergency-card-icon" role="img" aria-label="clock">⏰</span>
                <span className="resources-emergency-card-hours">{contact.hours}</span>
              </div>
              {contact.arabicSupport && (
                <div className="resources-arabic-badge">Arabic Support</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default Resources;
