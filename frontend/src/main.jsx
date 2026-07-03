import React from "react";
import ReactDOM from "react-dom/client";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./index.css";
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { AppShell } from "../components/AppShell";
import { AuthForm } from "../components/AuthForm";
import { ChatPanel } from "../components/ChatPanel";
import { Dashboard } from "../components/Dashboard";

function ShellRoute({ children }) {
  return <AppShell>{children}</AppShell>;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route path="/login" element={<AuthForm mode="login" />} />
            <Route path="/register" element={<AuthForm mode="register" />} />
            <Route path="/chat" element={<ShellRoute><ChatPanel /></ShellRoute>} />
            <Route path="/dashboard" element={<ShellRoute><Dashboard /></ShellRoute>} />
            <Route path="*" element={<Navigate to="/chat" replace />} />
          </Routes>
        </Router>
        <Toaster position="top-right" toastOptions={{ style: { background: "#101827", color: "#fff" } }} />
      </AuthProvider>
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
