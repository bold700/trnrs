import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Iphone } from "./screens/Iphone";
import { Callback } from "./screens/Callback";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Iphone />} />
        <Route path="/callback" element={<Callback />} />
      </Routes>
    </Router>
  </StrictMode>,
);
