import React from "react";
import { Link } from "react-router-dom";

const Home: React.FC = () => {

  return (
    <div className="home-container" style={{ minHeight: "100vh", background: "#f6faf9" }}>
      <nav style={{ display: "flex", justifyContent: "flex-end", padding: "2rem 4rem", gap: "2rem", fontWeight: 500 }}>
        <span style={{ color: "#23443a", textDecoration: "none", cursor: "pointer" }}>Services</span>
        <span style={{ color: "#23443a", textDecoration: "none", cursor: "pointer" }}>About</span>
        <span style={{ color: "#23443a", textDecoration: "none", cursor: "pointer" }}>Resources</span>
        <span style={{ color: "#23443a", textDecoration: "none", cursor: "pointer" }}>Contact</span>
      </nav>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "2rem" }}>
        <h1 style={{ fontSize: "3rem", fontWeight: 700, textAlign: "center", color: "#23443a" }}>
          Your Mental Wellness Journey<br />Starts Here
        </h1>
        <p style={{ color: "#7ca18c", fontSize: "1.25rem", textAlign: "center", maxWidth: 600, margin: "2rem 0" }}>
          We provide confidential, professional mental health support tailored to Omani culture. Our specialized team understands your traditions and values, offering compassionate care in a safe, comfortable environment.
        </p>
        <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
          <Link
            to="/chat"
            style={{
              background: "#1a8c7a",
              color: "#fff",
              border: "2px solid red",
              borderRadius: "8px",
              padding: "1rem 2rem",
              fontSize: "1.1rem",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 8px #e0eae6",
              textDecoration: "none",
              display: "inline-block",
              textAlign: "center",
              zIndex: 1000,
              position: "relative"
            }}
          >
            Begin Assessment
          </Link>
          <button
            style={{
              background: "transparent",
              color: "#1a8c7a",
              border: "none",
              fontSize: "1.1rem",
              fontWeight: 500,
              cursor: "pointer"
            }}
          >
            Learn more →
          </button>
        </div>
        <div style={{ display: "flex", gap: "2rem", marginTop: "2rem" }}>
          <div style={{
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 2px 8px #e0eae6",
            padding: "1rem 2rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem"
          }}>
            <span role="img" aria-label="lock" style={{ fontSize: "1.5rem", color: "#1a8c7a" }}>🔒</span>
            <span style={{ color: "#23443a", fontWeight: 500 }}>Confidential & Secure</span>
          </div>
          <div style={{
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 2px 8px #e0eae6",
            padding: "1rem 2rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem"
          }}>
            <span role="img" aria-label="heart" style={{ fontSize: "1.5rem", color: "#1a8c7a" }}>💙</span>
            <span style={{ color: "#23443a", fontWeight: 500 }}>Culturally Informed Care</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
