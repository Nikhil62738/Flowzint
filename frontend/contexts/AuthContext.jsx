"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function handleUnauthorized() {
      setUser(null);
    }

    window.addEventListener("eaca:unauthorized", handleUnauthorized);

    const token = localStorage.getItem("eaca_token");
    if (!token) {
      setLoading(false);
      return () => window.removeEventListener("eaca:unauthorized", handleUnauthorized);
    }
    api.get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem("eaca_token"))
      .finally(() => setLoading(false));

    return () => window.removeEventListener("eaca:unauthorized", handleUnauthorized);
  }, []);

  async function login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("eaca_token", res.data.token);
    setUser(res.data.user);
    toast.success("Welcome back");
  }

  async function register(name, email, password) {
    const res = await api.post("/auth/register", { name, email, password });
    localStorage.setItem("eaca_token", res.data.token);
    setUser(res.data.user);
    toast.success("Account created");
  }

  function logout() {
    localStorage.removeItem("eaca_token");
    setUser(null);
    toast.success("Signed out");
  }

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
