import React from "react";
import { Link } from "react-router-dom";
import Threads from "../components/Threads";

const Home: React.FC = () => {

  return (
    <>
      <Threads amplitude={1} distance={0} enableMouseInteraction={true} />
      <div className="home-container" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
      {/* Header with logo and nav */}
      <header style={{
        width: "100%",
        maxWidth: 900,
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "2rem 2.5rem 0 2.5rem"
      }}>
        {/* Replace this with <img src={require('../assets/elile-logo.png')} alt="Elile AI" /> if you add a logo image */}
        <div style={{
          fontWeight: 800,
          fontSize: "1.5rem",
          color: "#1a8c7a",
          letterSpacing: "1px"
        }}>
          Elile AI
        </div>
        <nav>
          <ul style={{
            display: "flex",
            gap: "2.5rem",
            listStyle: "none",
            margin: 0,
            padding: 0,
            fontWeight: 600,
            fontSize: "1.1rem"
          }}>
            <li><Link to="/about" style={{ color: "#23443a", cursor: "pointer", textDecoration: "none" }}>About</Link></li>
            <li><Link to="/resources" style={{ color: "#23443a", cursor: "pointer", textDecoration: "none" }}>Resources</Link></li>
            <li><Link to="/our-value" style={{ color: "#23443a", cursor: "pointer", textDecoration: "none" }}>Our Value</Link></li>
          </ul>
        </nav>
      </header>
      <div className="omani-motif-bg" style={{ width: "100%", maxWidth: 900, margin: "2rem auto" }}>
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
    </div>
    </>
  );
};

export default Home;
