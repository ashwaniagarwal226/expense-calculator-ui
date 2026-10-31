import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import SaveMore from "./pages/SaveMore";
import Rules from "./pages/Rules";
import Profiles from "./pages/Profiles";
import NotFound from "./components/NotFound";
import { api } from "./api";
import { ProfileProvider, ProfileSwitcher } from "./profile";

function App() {
  const [ai, setAi] = useState(null);

  useEffect(() => {
    api.aiStatus().then(setAi).catch(() => setAi({ enabled: false, hint: "Backend not reachable" }));
  }, []);

  return (
    <ProfileProvider>
      <Router>
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark" aria-hidden>₹</span>
            <span>Expense Calculator</span>
          </div>
          <nav className="nav">
            <NavLink to="/" end>Dashboard</NavLink>
            <NavLink to="/transactions">Transactions</NavLink>
            <NavLink to="/save">Save more</NavLink>
            <NavLink to="/rules">Rules</NavLink>
            <NavLink to="/profiles">Profiles</NavLink>
          </nav>
          <ProfileSwitcher />
          {ai && (
            <span className={`ai-pill ${ai.enabled ? "on" : "off"}`} title={ai.hint || ai.model}>
              <span aria-hidden>{ai.enabled ? "●" : "○"}</span> Gemini {ai.enabled ? "on" : "off"}
            </span>
          )}
        </header>
        <main className="page">
          <Routes>
            <Route path="/" element={<Dashboard ai={ai} />} />
            <Route path="/transactions" element={<Transactions ai={ai} />} />
            <Route path="/save" element={<SaveMore ai={ai} />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/profiles" element={<Profiles />} />
            <Route path="/bar-chart" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </Router>
    </ProfileProvider>
  );
}

export default App;
