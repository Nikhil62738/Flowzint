"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Flame, Gauge, MessageCircle, Search, ShieldCheck, Sparkles, Target, Users, Zap } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { api } from "../lib/api";
import { fallbackAnalytics } from "../lib/emotions";
import { EmotionBadge } from "./EmotionBadge";
import { StatCard } from "./ui/StatCard";

const colors = ["#ff5c7a", "#ff9d42", "#ffcf5a", "#23d7ff", "#6df2b8", "#a78bfa"];

export function Dashboard() {
  const [data, setData] = useState(fallbackAnalytics);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/analytics/dashboard")
      .then((res) => setData(res.data))
      .catch(() => toast("Using demo analytics until backend/auth is connected"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      transports: ["websocket", "polling"]
    });

    socket.on("ticket:escalated", ({ escalation }) => {
      toast.error(escalation?.reason || "New high-priority escalation");
      api.get("/analytics/dashboard").then((res) => setData(res.data)).catch(() => {});
    });
    socket.on("feedback:new", ({ rating }) => {
      toast.success(`New customer feedback: ${rating}/5`);
      api.get("/analytics/dashboard").then((res) => setData(res.data)).catch(() => {});
    });

    return () => socket.disconnect();
  }, []);

  const emotionRows = useMemo(
    () => Object.entries(data.emotionDistribution || {}).map(([name, value]) => ({ name, value })),
    [data]
  );

  const trend = [
    { day: "Mon", satisfaction: 78, performance: 83 },
    { day: "Tue", satisfaction: 81, performance: 86 },
    { day: "Wed", satisfaction: 79, performance: 84 },
    { day: "Thu", satisfaction: 86, performance: 89 },
    { day: "Fri", satisfaction: 84, performance: 91 },
    { day: "Sat", satisfaction: 88, performance: 93 },
    { day: "Sun", satisfaction: 91, performance: 94 }
  ];

  const filteredUsers = (data.mostFrustratedUsers || []).filter((user) =>
    `${user.name} ${user.email} ${user.emotion}`.toLowerCase().includes(query.toLowerCase())
  );
  const filteredConversations = (data.conversations || []).filter((conversation) =>
    [
      conversation.title,
      conversation.user?.name,
      conversation.user?.email,
      conversation.currentEmotion,
      conversation.status,
      conversation.priority
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <div className="space-y-3 sm:space-y-4">
      <header className="glass rounded-xl p-3 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm text-white/55">Command center</p>
            <h1 className="text-2xl font-bold sm:text-3xl">Emotion Intelligence Dashboard</h1>
          </div>
          <div className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/8 px-3 py-2 lg:w-auto">
            <Search size={16} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users or tickets" className="min-w-0 flex-1 bg-transparent text-sm outline-none lg:w-56" />
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-9">
        <StatCard icon={MessageCircle} label="Conversations" value={data.cards.totalConversations} accent="bg-sky-400/15 text-sky-200" />
        <StatCard icon={Users} label="Users" value={data.cards.totalUsers} accent="bg-emerald-400/15 text-emerald-200" />
        <StatCard icon={AlertTriangle} label="Escalations" value={data.cards.escalatedTickets} accent="bg-red-400/15 text-red-200" />
        <StatCard icon={CheckCircle2} label="Resolved" value={data.cards.resolvedTickets || 0} accent="bg-emerald-400/15 text-emerald-100" />
        <StatCard icon={Activity} label="Active now" value={data.cards.activeUsers} accent="bg-violet-400/15 text-violet-200" />
        <StatCard icon={ShieldCheck} label="CSAT" value={`${data.cards.avgSatisfaction}%`} accent="bg-yellow-400/15 text-yellow-100" />
        <StatCard icon={Flame} label="Risk" value={`${data.cards.avgEscalationRisk || 24}%`} accent="bg-orange-400/15 text-orange-100" />
        <StatCard icon={Target} label="Resolve" value={`${data.cards.avgResolutionProbability || 82}%`} accent="bg-cyan-400/15 text-cyan-100" />
        <StatCard icon={Gauge} label="Predicted CSAT" value={`${data.cards.avgSatisfactionPrediction || 88}%`} accent="bg-pink-400/15 text-pink-100" />
      </section>

      {loading && (
        <section className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="glass h-24 animate-pulse rounded-xl p-4">
              <div className="h-3 w-1/2 rounded bg-white/10" />
              <div className="mt-4 h-5 w-3/4 rounded bg-white/10" />
            </div>
          ))}
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="glass rounded-xl p-3 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="text-neon-cyan" size={20} />
            <h2 className="font-bold">AI Business Insights</h2>
          </div>
          <div className="space-y-3">
            {(data.insights || []).map((insight) => (
              <div key={insight} className="flex gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/70">
                <Zap className="mt-0.5 shrink-0 text-neon-amber" size={16} />
                {insight}
              </div>
            ))}
          </div>
        </div>
        <div className="glass rounded-xl p-3 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 className="text-neon-green" size={20} />
            <h2 className="font-bold">AI Response Performance</h2>
          </div>
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="min-w-[420px] w-full text-left text-sm">
              <thead className="bg-white/8 text-xs uppercase tracking-wider text-white/45">
                <tr>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Responses</th>
                  <th className="px-4 py-3">Avg latency</th>
                </tr>
              </thead>
              <tbody>
                {(data.responsePerformance || []).map((row) => (
                  <tr key={row._id || "unknown"} className="border-t border-white/10">
                    <td className="px-4 py-3 font-semibold capitalize">{row._id || "unknown"}</td>
                    <td className="px-4 py-3 text-white/70">{row.responses}</td>
                    <td className="px-4 py-3 text-white/70">{Math.round(row.avgLatencyMs || 0)} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="glass rounded-xl p-3 sm:p-5">
          <h2 className="mb-4 font-bold">Emotion Distribution</h2>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={emotionRows} dataKey="value" nameKey="name" innerRadius={70} outerRadius={115} paddingAngle={3}>
                  {emotionRows.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#101827", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass rounded-xl p-3 sm:p-5">
          <h2 className="mb-4 font-bold">Satisfaction and AI Performance</h2>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="sat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#23d7ff" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#23d7ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.08)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,.5)" />
                <YAxis stroke="rgba(255,255,255,.5)" />
                <Tooltip contentStyle={{ background: "#101827", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8 }} />
                <Area dataKey="satisfaction" stroke="#23d7ff" fill="url(#sat)" />
                <Area dataKey="performance" stroke="#6df2b8" fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="glass rounded-xl p-3 sm:p-5">
          <h2 className="mb-4 font-bold">Priority Customers</h2>
          <div className="space-y-3">
            {filteredUsers.length === 0 && <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white/55">No matching high-risk customers.</p>}
            {filteredUsers.map((user) => (
              <div key={user.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-xs text-white/50">{user.email}</p>
                  </div>
                  <EmotionBadge emotion={user.emotion} confidence={user.confidence} />
                </div>
                <p className="mt-3 text-xs uppercase tracking-wider text-white/45">Priority: {user.priority}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="glass rounded-xl p-3 sm:p-5">
          <h2 className="mb-4 font-bold">Live Volume by Emotion</h2>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer>
              <BarChart data={emotionRows}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.08)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,.5)" />
                <YAxis stroke="rgba(255,255,255,.5)" />
                <Tooltip contentStyle={{ background: "#101827", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8 }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {emotionRows.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="glass rounded-xl p-3 sm:p-5">
          <h2 className="mb-4 font-bold">Emotion Heatmap</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(data.mostFrustratedHours || []).map((row) => {
              const total = (row.angry || 0) + (row.frustrated || 0) + (row.urgent || 0);
              return (
                <div key={row.hour} className="rounded-lg border border-white/10 p-3" style={{ background: heatColor(total) }}>
                  <p className="text-xs text-white/50">{String(row.hour).padStart(2, "0")}:00</p>
                  <p className="mt-1 text-lg font-bold">{total}</p>
                  <p className="text-[11px] text-white/55">negative signals</p>
                </div>
              );
            })}
          </div>
        </div>
        <div className="glass rounded-xl p-3 sm:p-5">
          <h2 className="mb-4 font-bold">Common Complaint Topics</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={data.complaintTopics || []} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.08)" />
                <XAxis type="number" stroke="rgba(255,255,255,.5)" />
                <YAxis dataKey="topic" type="category" stroke="rgba(255,255,255,.5)" width={74} />
                <Tooltip contentStyle={{ background: "#101827", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8 }} />
                <Bar dataKey="count" fill="#ff9d42" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="glass rounded-xl p-3 sm:p-5">
        <h2 className="mb-4 font-bold">Emotion Trends Over Time</h2>
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={data.emotionTrends || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.08)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,.5)" />
              <YAxis stroke="rgba(255,255,255,.5)" />
              <Tooltip contentStyle={{ background: "#101827", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8 }} />
              <Line type="monotone" dataKey="Angry" stroke="#ff5c7a" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Frustrated" stroke="#ff9d42" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Urgent" stroke="#ffcf5a" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Confused" stroke="#a78bfa" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Happy" stroke="#6df2b8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="glass rounded-xl p-3 sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-bold">Conversation Logs</h2>
          <p className="text-xs text-white/50">Live cases, escalation status, emotion, priority, and CSAT.</p>
        </div>
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="min-w-[920px] w-full text-left text-sm">
            <thead className="bg-white/8 text-xs uppercase tracking-wider text-white/45">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Conversation</th>
                <th className="px-4 py-3">Emotion</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Risk</th>
                <th className="px-4 py-3">Resolve</th>
                <th className="px-4 py-3">CSAT</th>
              </tr>
            </thead>
            <tbody>
              {filteredConversations.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-white/55">
                    No conversation logs match the current search.
                  </td>
                </tr>
              )}
              {filteredConversations.slice(0, 12).map((conversation) => (
                <tr key={conversation._id} className="border-t border-white/10">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{conversation.user?.name || "Demo customer"}</p>
                    <p className="text-xs text-white/50">{conversation.user?.email || "customer@example.com"}</p>
                  </td>
                  <td className="max-w-[260px] truncate px-4 py-3 text-white/70">{conversation.title}</td>
                  <td className="px-4 py-3">
                    <EmotionBadge emotion={conversation.currentEmotion || "Neutral"} confidence={conversation.emotionConfidence || 0} />
                  </td>
                  <td className="px-4 py-3 capitalize text-white/70">{conversation.status}</td>
                  <td className="px-4 py-3 capitalize text-white/70">{conversation.priority}</td>
                  <td className="px-4 py-3 text-white/70">{conversation.escalationRisk?.riskScore ?? "-"}%</td>
                  <td className="px-4 py-3 text-white/70">{conversation.resolutionPrediction?.resolutionProbability ?? "-"}%</td>
                  <td className="px-4 py-3 text-white/70">{conversation.csatRating ? `${conversation.csatRating}/5` : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function heatColor(value) {
  const alpha = Math.min(0.42, 0.08 + value / 70);
  return `rgba(255, 92, 122, ${alpha})`;
}
