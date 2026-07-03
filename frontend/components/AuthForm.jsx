"use client";

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bot } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "./ui/Button";
import { useAuth } from "../contexts/AuthContext";

export function AuthForm({ mode }) {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === "register") await register(form.name, form.email, form.password);
      else await login(form.email, form.password);
      navigate("/chat");
    } catch (error) {
      toast.error(error.response?.data?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center p-5">
      <form onSubmit={submit} className="glass w-full max-w-md rounded-xl p-6">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-lg bg-neon-cyan p-2 text-ink shadow-glow">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold">{mode === "register" ? "Create account" : "Welcome back"}</h1>
            <p className="text-sm text-white/60">Adaptive AI support workspace</p>
          </div>
        </div>
        {mode === "register" && (
          <label className="mb-4 block text-sm">
            Name
            <input className="mt-2 w-full rounded-lg border border-white/10 bg-white/8 px-3 py-3 outline-none focus:border-neon-cyan" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
        )}
        <label className="mb-4 block text-sm">
          Email
          <input type="email" className="mt-2 w-full rounded-lg border border-white/10 bg-white/8 px-3 py-3 outline-none focus:border-neon-cyan" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </label>
        <label className="mb-6 block text-sm">
          Password
          <input type="password" className="mt-2 w-full rounded-lg border border-white/10 bg-white/8 px-3 py-3 outline-none focus:border-neon-cyan" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </label>
        <Button className="w-full" disabled={loading}>{loading ? "Please wait..." : mode === "register" ? "Register" : "Login"}</Button>
        <p className="mt-5 text-center text-sm text-white/60">
          {mode === "register" ? "Already have an account?" : "New here?"}{" "}
          <Link className="text-neon-cyan" to={mode === "register" ? "/login" : "/register"}>
            {mode === "register" ? "Login" : "Create one"}
          </Link>
        </p>
      </form>
    </main>
  );
}
