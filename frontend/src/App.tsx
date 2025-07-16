/* Removed unused React import */
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import Resources from "./pages/Resources";
import About from "./pages/About";
import OurValue from "./pages/OurValue";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/about" element={<About />} />
        <Route path="/our-value" element={<OurValue />} />
      </Routes>
    </Router>
  );
}

export default App;
