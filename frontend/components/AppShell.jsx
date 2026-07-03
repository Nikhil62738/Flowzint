"use client";

import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BarChart3, Bot, LogOut, MessageSquare, Moon, Sun, UserRound } from "lucide-react";
import { Button } from "./ui/Button";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

const nav = [
  { href: "/chat", label: "Care Agent", icon: MessageSquare },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 }
];

export function AppShell({ children }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!loading && !user) navigate("/login", { replace: true });
  }, [loading, navigate, user]);

  function signOut() {
    logout();
    navigate("/login");
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center p-5">
        <div className="glass rounded-xl p-6 text-sm text-white/70">Checking secure session...</div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen px-2 pb-24 pt-2 sm:p-5 lg:pb-5">
      <header className="glass sticky top-2 z-30 mb-3 flex items-center justify-between rounded-xl p-3 lg:hidden">
        <Link to="/chat" className="flex min-w-0 items-center gap-2">
          <div className="rounded-lg bg-neon-cyan p-2 text-ink shadow-glow">
            <Bot size={20} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">Emotion-Aware</p>
            <p className="text-[11px] text-white/55">Care Agent</p>
          </div>
        </Link>
        <div className="flex shrink-0 gap-2">
          <Button variant="ghost" className="h-10 w-10 p-0" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </Button>
          <Button variant="ghost" className="h-10 w-10 p-0" onClick={signOut} aria-label="Sign out">
            <LogOut size={16} />
          </Button>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl gap-4">
        <aside className="glass sticky top-5 hidden h-[calc(100vh-2.5rem)] w-72 rounded-xl p-4 lg:block">
          <Link to="/" className="flex items-center gap-3">
            <div className="rounded-lg bg-neon-cyan p-2 text-ink shadow-glow">
              <Bot size={24} />
            </div>
            <div>
              <p className="font-bold">Emotion-Aware</p>
              <p className="text-xs text-white/55">Care Agent</p>
            </div>
          </Link>
          <nav className="mt-8 space-y-2">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                    active ? "bg-white/16 text-white" : "text-white/65 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="absolute bottom-4 left-4 right-4 space-y-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-2 text-sm">
                <UserRound size={16} />
                <span className="truncate">{user?.name || "Demo User"}</span>
              </div>
              <p className="mt-1 text-xs text-white/50">{user?.role || "customer"}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </Button>
              <Button variant="ghost" className="flex-1" onClick={signOut}>
                <LogOut size={16} />
              </Button>
            </div>
          </div>
        </aside>
        <section className="min-w-0 flex-1">{children}</section>
      </div>
      <nav className="glass fixed bottom-3 left-3 right-3 z-40 grid grid-cols-2 gap-2 rounded-xl p-2 lg:hidden">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-xs font-semibold transition ${
                active ? "bg-neon-cyan text-ink" : "bg-white/5 text-white/70"
              }`}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </main>
  );
}
