"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Brain, CheckCircle2, Download, FileText, Gauge, HeartPulse, Languages, Mic, Send, Sparkles, Star } from "lucide-react";
import jsPDF from "jspdf";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { EmotionBadge } from "./EmotionBadge";
import { Button } from "./ui/Button";

const starterMessages = [
  {
    sender: "ai",
    content: "Hi, I'm your emotion-aware care agent. Tell me what's happening and I'll adapt my response to your tone and urgency.",
    createdAt: "2026-01-01T00:00:00.000Z",
    emotion: { label: "Neutral", confidence: 82 }
  }
];
const defaultIntelligence = {
  timeline: [{ emotion: "Neutral", confidence: 82, topic: "General" }],
  escalationRisk: { riskScore: 12, riskLevel: "Low", drivers: ["new conversation"] },
  resolutionPrediction: { resolutionProbability: 87, satisfactionPrediction: 91, rationale: "Fresh case with manageable emotional intensity" },
  explainability: {
    detectedEmotion: "Neutral",
    confidenceScore: 82,
    reasonForClassification: "neutral wording with no strong emotional trigger",
    selectedResponseTone: "professional and clear",
    escalationDecision: "No immediate escalation required"
  },
  agentCoach: {
    conversationSummary: "No escalation yet. Monitor the next customer message.",
    rootCause: "Awaiting customer issue details.",
    customerMood: "Neutral",
    suggestedReply: "Ask one clear question and confirm the customer's goal.",
    priorityLevel: "normal",
    recommendedNextSteps: ["Collect issue details", "Confirm account context", "Offer a clear next step"]
  },
  voiceEmotion: null
};

export function ChatPanel() {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState(starterMessages);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("en");
  const [typing, setTyping] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [listening, setListening] = useState(false);
  const [summary, setSummary] = useState("");
  const [caseStatus, setCaseStatus] = useState("unresolved");
  const [rating, setRating] = useState(0);
  const [currentEmotion, setCurrentEmotion] = useState({ label: "Neutral", confidence: 82 });
  const [intelligence, setIntelligence] = useState(defaultIntelligence);
  const [voiceMode, setVoiceMode] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    if (!conversationId) return undefined;
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      transports: ["websocket", "polling"]
    });

    socket.emit("conversation:join", conversationId);
    socket.on("conversation:updated", ({ conversation }) => {
      if (conversation?._id === conversationId) {
        setCaseStatus(conversation.resolutionStatus || "unresolved");
        toast("Conversation status updated");
      }
    });

    return () => {
      socket.emit("conversation:leave", conversationId);
      socket.disconnect();
    };
  }, [conversationId]);

  const quickPrompts = useMemo(
    () => [
      "I am very angry because my refund is still not processed!",
      "This is urgent, our production account is locked right now.",
      "I do not understand how to update my billing details.",
      "Thanks, the last agent was really helpful."
    ],
    []
  );

  async function sendMessage(text = input) {
    if (!text.trim()) return;
    const optimistic = {
      sender: "user",
      content: text,
      createdAt: new Date().toISOString(),
      emotion: currentEmotion
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    setTyping(true);

    try {
      const path = conversationId ? `/conversations/${conversationId}/message` : "/conversations/message";
      const res = await api.post(path, { content: text, language, voiceInput: voiceMode });
      setConversationId(res.data.conversation._id);
      setCurrentEmotion(res.data.emotion);
      setCaseStatus(res.data.conversation.resolutionStatus || "unresolved");
      if (res.data.intelligence) setIntelligence(res.data.intelligence);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        res.data.userMessage,
        res.data.aiMessage
      ]);
      if (res.data.escalation?.shouldEscalate) toast.error("Conversation escalated for human intervention");
    } catch (error) {
      toast.error(error.response?.data?.message || "Backend unavailable. Showing local demo response.");
      const demoEmotion = inferLocalEmotion(text);
      const demoIntel = localIntelligence(text, demoEmotion, voiceMode);
      setCurrentEmotion(demoEmotion);
      setIntelligence(demoIntel);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          content: localReply(demoEmotion),
          createdAt: new Date().toISOString(),
          emotion: demoEmotion
        }
      ]);
    } finally {
      setTyping(false);
      setVoiceMode(false);
    }
  }

  function startVoice() {
    if (!window.isSecureContext && window.location.hostname !== "localhost") {
      toast.error("Voice input needs HTTPS on mobile. Use localhost, deploy, or open through an HTTPS tunnel.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this mobile browser. Try Chrome on Android.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === "hi" ? "hi-IN" : "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      setListening(true);
      toast("Listening...");
    };
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || "")
        .join(" ")
        .trim();
      setInput(transcript);
      setVoiceMode(true);
    };
    recognition.onerror = (event) => {
      const messages = {
        "not-allowed": "Microphone permission was blocked. Allow mic access in browser settings.",
        "no-speech": "No speech detected. Tap the mic and speak again.",
        network: "Speech service network error. Check your connection.",
        "audio-capture": "No microphone was found on this device."
      };
      toast.error(messages[event.error] || `Voice input failed: ${event.error}`);
    };
    recognition.onend = () => setListening(false);
    recognition.start();
  }

  function exportPdf() {
    const pdf = new jsPDF();
    pdf.setFontSize(16);
    pdf.text("Emotion-Aware Care Agent Conversation", 14, 18);
    let y = 32;
    messages.forEach((message) => {
      const line = `${message.sender.toUpperCase()}: ${message.content}`;
      const wrapped = pdf.splitTextToSize(line, 180);
      pdf.text(wrapped, 14, y);
      y += wrapped.length * 7 + 4;
      if (y > 280) {
        pdf.addPage();
        y = 18;
      }
    });
    pdf.save("emotion-aware-conversation.pdf");
  }

  async function generateSummary() {
    if (!conversationId) {
      toast("Send at least one message before generating a summary");
      return;
    }
    try {
      const res = await api.post(`/conversations/${conversationId}/summary`);
      setSummary(res.data.summary);
      toast.success("Conversation summary generated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to generate summary");
    }
  }

  async function submitRating(value) {
    setRating(value);
    if (!conversationId) {
      toast("Start a conversation before rating it");
      return;
    }
    try {
      const res = await api.post(`/conversations/${conversationId}/feedback`, {
        rating: value,
        comment: value >= 4 ? "Helpful adaptive response" : "Needs human review"
      });
      setCaseStatus(res.data.conversation.resolutionStatus);
      toast.success("Feedback saved");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save feedback");
    }
  }

  return (
    <div className="grid gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="glass flex min-h-[68vh] flex-col rounded-xl">
        <header className="flex flex-col gap-3 border-b border-white/10 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="min-w-0">
            <p className="text-sm text-white/55">Real-time adaptive support</p>
            <h1 className="text-xl font-bold sm:text-2xl">AI Chat Interface</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <EmotionBadge emotion={currentEmotion.label} confidence={currentEmotion.confidence} />
            <Button variant="ghost" onClick={generateSummary} aria-label="Generate summary"><FileText size={16} /></Button>
            <Button variant="ghost" onClick={exportPdf} aria-label="Export PDF"><Download size={16} /></Button>
          </div>
        </header>
        <div className="max-h-[62vh] flex-1 space-y-4 overflow-y-auto p-3 sm:max-h-none sm:p-4">
          {messages.map((message, index) => (
            <motion.div
              key={message._id || index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2 sm:gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.sender !== "user" && <Avatar label="AI" />}
              <div className={`max-w-[86%] rounded-xl p-3 sm:max-w-[82%] sm:p-4 ${message.sender === "user" ? "bg-neon-cyan text-ink" : "bg-white/8"}`}>
                <p className="text-sm leading-relaxed">{message.content}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] opacity-75">
                  <span>{mounted ? formatTime(message.createdAt) : "--:--"}</span>
                  {message.emotion?.label && <EmotionBadge emotion={message.emotion.label} confidence={message.emotion.confidence} />}
                </div>
              </div>
              {message.sender === "user" && <Avatar label="You" />}
            </motion.div>
          ))}
          {typing && (
            <div className="flex items-center gap-3 text-sm text-white/60">
              <Avatar label="AI" />
              <span className="rounded-xl bg-white/8 px-4 py-3">AI is calibrating tone...</span>
            </div>
          )}
          <div ref={endRef} />
        </div>
        <div className="border-t border-white/10 p-3 sm:p-4">
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
            {quickPrompts.map((prompt) => (
              <button key={prompt} onClick={() => sendMessage(prompt)} className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 hover:bg-white/10">
                {prompt}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="h-11 rounded-lg border border-white/10 bg-white/8 px-3 text-sm outline-none">
              <option value="en">EN</option>
              <option value="hi">HI</option>
              <option value="es">ES</option>
              <option value="fr">FR</option>
            </select>
            <button
              onClick={startVoice}
              className={`h-11 rounded-lg border border-white/10 px-3 transition ${listening ? "bg-neon-cyan text-ink shadow-glow" : "bg-white/8"}`}
              aria-label="Voice input"
              title="Voice input"
            >
              <Mic size={18} />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Describe the customer issue..."
              className="order-first h-11 min-w-0 basis-full rounded-lg border border-white/10 bg-white/8 px-4 outline-none focus:border-neon-cyan sm:order-none sm:flex-1 sm:basis-auto"
            />
            <Button className="h-11 flex-1 sm:flex-none" onClick={() => sendMessage()}><Send size={18} /> Send</Button>
          </div>
        </div>
      </section>
      <aside className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:block xl:space-y-4">
        <div className="glass rounded-xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 className="text-neon-green" size={20} />
            <h2 className="font-bold">Case Control</h2>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-xs uppercase tracking-wider text-white/45">Resolution</p>
            <p className="mt-1 text-sm font-semibold capitalize">{caseStatus}</p>
          </div>
          <div className="mt-4">
            <p className="mb-2 text-xs uppercase tracking-wider text-white/45">Customer rating</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} onClick={() => submitRating(value)} className="rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/10" aria-label={`Rate ${value}`}>
                  <Star size={18} className={value <= rating ? "fill-yellow-300 text-yellow-300" : "text-white/35"} />
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <HeartPulse className="text-neon-pink" size={20} />
            <h2 className="font-bold">Emotion Timeline</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {(intelligence.timeline || []).map((item, index) => (
              <div key={`${item.emotion}-${index}`} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <p className="text-lg">{emojiFor(item.emotion)}</p>
                <p className="text-xs font-semibold">{item.emotion}</p>
                <p className="text-[11px] text-white/45">{item.confidence}% · {item.topic}</p>
              </div>
            ))}
            {caseStatus === "resolved" && (
              <div className="rounded-lg border border-emerald-300/30 bg-emerald-400/10 px-3 py-2">
                <p className="text-lg">😌</p>
                <p className="text-xs font-semibold">Resolved</p>
                <p className="text-[11px] text-white/45">case closed</p>
              </div>
            )}
          </div>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="text-neon-amber" size={20} />
            <h2 className="font-bold">Predictive Escalation</h2>
          </div>
          <Metric label="Escalation Risk" value={`${intelligence.escalationRisk?.riskScore || 12}%`} tone={riskTone(intelligence.escalationRisk?.riskLevel)} />
          <p className="mt-2 text-sm font-semibold">{intelligence.escalationRisk?.riskLevel || "Low"}</p>
          <div className="mt-3 space-y-2">
            {(intelligence.escalationRisk?.drivers || []).map((driver) => (
              <p key={driver} className="rounded-lg bg-white/5 px-3 py-2 text-xs text-white/60">{driver}</p>
            ))}
          </div>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <Brain className="text-neon-cyan" size={20} />
            <h2 className="font-bold">Explainable AI</h2>
          </div>
          <dl className="space-y-3 text-sm">
            <Row label="Detected" value={intelligence.explainability?.detectedEmotion || currentEmotion.label} />
            <Row label="Confidence" value={`${intelligence.explainability?.confidenceScore || currentEmotion.confidence}%`} />
            <Row label="Tone" value={intelligence.explainability?.selectedResponseTone || toneFor(currentEmotion.label).tone} />
          </dl>
          <p className="mt-3 rounded-lg bg-white/5 p-3 text-xs leading-relaxed text-white/60">{intelligence.explainability?.reasonForClassification}</p>
          <p className="mt-2 rounded-lg bg-white/5 p-3 text-xs leading-relaxed text-white/60">{intelligence.explainability?.escalationDecision}</p>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <Gauge className="text-neon-green" size={20} />
            <h2 className="font-bold">Resolution Predictor</h2>
          </div>
          <Metric label="Resolution Probability" value={`${intelligence.resolutionPrediction?.resolutionProbability || 87}%`} tone="bg-emerald-400" />
          <Metric label="Satisfaction Prediction" value={`${intelligence.resolutionPrediction?.satisfactionPrediction || 91}%`} tone="bg-sky-400" />
          <p className="mt-3 text-xs leading-relaxed text-white/55">{intelligence.resolutionPrediction?.rationale}</p>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="text-neon-amber" size={20} />
            <h2 className="font-bold">AI Agent Coach</h2>
          </div>
          <dl className="space-y-3 text-sm">
            <Row label="Priority" value={intelligence.agentCoach?.priorityLevel || "normal"} />
            <Row label="Mood" value={intelligence.agentCoach?.customerMood || currentEmotion.label} />
          </dl>
          <p className="mt-3 rounded-lg bg-white/5 p-3 text-xs leading-relaxed text-white/65">{intelligence.agentCoach?.conversationSummary}</p>
          <p className="mt-2 rounded-lg bg-white/5 p-3 text-xs leading-relaxed text-white/65">{intelligence.agentCoach?.suggestedReply}</p>
          <div className="mt-3 space-y-2">
            {(intelligence.agentCoach?.recommendedNextSteps || []).slice(0, 4).map((step) => (
              <p key={step} className="text-xs text-white/55">• {step}</p>
            ))}
          </div>
        </div>
        {intelligence.voiceEmotion?.enabled && (
          <div className="glass rounded-xl p-5">
            <div className="mb-4 flex items-center gap-2">
              <Mic className="text-neon-cyan" size={20} />
              <h2 className="font-bold">Voice Emotion</h2>
            </div>
            <dl className="space-y-3 text-sm">
              <Row label="Vocal mood" value={intelligence.voiceEmotion.vocalEmotion} />
              <Row label="Pitch" value={intelligence.voiceEmotion.pitch} />
              <Row label="Pace" value={intelligence.voiceEmotion.pace} />
              <Row label="Energy" value={intelligence.voiceEmotion.energy} />
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-white/50">{intelligence.voiceEmotion.note}</p>
          </div>
        )}
        <div className="glass rounded-xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="text-neon-cyan" size={20} />
            <h2 className="font-bold">AI Summary</h2>
          </div>
          {summary ? (
            <p className="text-sm leading-relaxed text-white/70">{summary}</p>
          ) : (
            <p className="text-sm leading-relaxed text-white/50">Generate a summary after the conversation starts. This is useful for human handoff and ticket review.</p>
          )}
        </div>
        <div className="glass rounded-xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="text-neon-cyan" size={20} />
            <h2 className="font-bold">Adaptive Behavior</h2>
          </div>
          <dl className="space-y-3 text-sm">
            <Row label="Tone" value={toneFor(currentEmotion.label).tone} />
            <Row label="Empathy" value={toneFor(currentEmotion.label).empathy} />
            <Row label="Response" value={toneFor(currentEmotion.label).length} />
            <Row label="Escalation" value={["Angry", "Urgent", "Frustrated"].includes(currentEmotion.label) ? "Watching closely" : "Normal"} />
          </dl>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <Languages className="text-neon-green" size={20} />
            <h2 className="font-bold">Workflow</h2>
          </div>
          {["Message", "Emotion", "Tone", "AI Reply", "Escalation", "Database"].map((item, index) => (
            <div key={item} className="mb-3 flex items-center gap-3 text-sm text-white/70">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/10 text-xs">{index + 1}</span>
              {item}
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

function Avatar({ label }) {
  return <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/12 text-[11px] font-bold sm:h-9 sm:w-9 sm:text-xs">{label}</div>;
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-white/55">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}

function Metric({ label, value, tone }) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between text-xs text-white/55">
        <span>{label}</span>
        <span className="font-semibold text-white">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full ${tone || "bg-neon-cyan"}`} style={{ width: value }} />
      </div>
    </div>
  );
}

function inferLocalEmotion(text) {
  const lower = text.toLowerCase();
  if (/angry|furious|worst|unacceptable|!{2,}/.test(lower)) return { label: "Angry", confidence: 88 };
  if (/urgent|asap|right now|critical/.test(lower)) return { label: "Urgent", confidence: 86 };
  if (/confused|understand|\?/.test(lower)) return { label: "Confused", confidence: 78 };
  if (/thanks|great|happy|awesome/.test(lower)) return { label: "Happy", confidence: 84 };
  if (/again|still|broken|frustrated/.test(lower)) return { label: "Frustrated", confidence: 82 };
  return { label: "Neutral", confidence: 75 };
}

function localReply(emotion) {
  const replies = {
    Angry: "I'm sorry this has reached such a frustrating point. I'll focus on calming this down, identifying the cause, and moving it toward a concrete resolution immediately.",
    Frustrated: "I understand why this feels exhausting. Let's remove the back-and-forth: I'll summarize the issue, check the likely failure point, and give you the next best action.",
    Urgent: "Understood. I'll keep this concise: confirm the affected account, preserve any error message, and prioritize the fastest recovery path.",
    Confused: "No problem. I'll break this into simple steps and explain what each one does so you can move forward confidently.",
    Happy: "That's great to hear. I'm glad the experience is working well, and I can help you keep that momentum going.",
    Neutral: "Thanks for the context. I'll handle this professionally and guide you through the best next step."
  };
  return replies[emotion.label] || replies.Neutral;
}

function localIntelligence(text, emotion, voiceInput) {
  const riskBase = { Angry: 82, Frustrated: 62, Urgent: 68, Confused: 36, Happy: 10, Neutral: 18 }[emotion.label] || 18;
  const riskLevel = riskBase >= 78 ? "Critical" : riskBase >= 55 ? "High" : riskBase >= 30 ? "Medium" : "Low";
  const resolution = Math.max(22, Math.min(94, 88 - Math.round(riskBase * 0.35)));
  const topic = /refund|billing|payment/i.test(text) ? "Refund" : /locked|login|account/i.test(text) ? "Login" : /confused|how/i.test(text) ? "How-to" : "General";

  return {
    timeline: [{ emotion: emotion.label, confidence: emotion.confidence, topic }],
    escalationRisk: {
      riskScore: riskBase,
      riskLevel,
      drivers: [`${emotion.label} at ${emotion.confidence}% confidence`, `${topic} topic`, "local demo risk model"]
    },
    resolutionPrediction: {
      resolutionProbability: resolution,
      satisfactionPrediction: Math.min(96, resolution + (emotion.label === "Happy" ? 8 : 2)),
      rationale: resolution >= 75 ? "Issue appears resolvable in this conversation" : "Escalation risk may reduce first-contact resolution"
    },
    explainability: {
      detectedEmotion: emotion.label,
      confidenceScore: emotion.confidence,
      reasonForClassification: "Local classifier matched emotional keywords, punctuation, and question patterns.",
      selectedResponseTone: toneFor(emotion.label).tone,
      escalationDecision: riskBase >= 55 ? "Predictive model recommends close monitoring or human handoff" : "No immediate escalation required"
    },
    agentCoach: {
      conversationSummary: `${topic} conversation with ${emotion.label.toLowerCase()} customer mood.`,
      rootCause: `Likely ${topic.toLowerCase()} friction based on the latest message.`,
      customerMood: `${emotion.label} (${emotion.confidence}%)`,
      suggestedReply: riskBase >= 55 ? "Acknowledge impact, take ownership, and offer a concrete next step." : "Confirm the request and guide the customer calmly.",
      priorityLevel: riskBase >= 78 ? "critical" : riskBase >= 55 ? "high" : "normal",
      recommendedNextSteps: ["Confirm account context", "Summarize the issue", riskBase >= 55 ? "Offer human handoff" : "Continue AI-assisted resolution"]
    },
    voiceEmotion: voiceInput
      ? {
          enabled: true,
          vocalEmotion: /!/.test(text) ? "stressed" : /\?/.test(text) ? "uncertain" : "calm",
          pitch: /!/.test(text) ? "elevated" : "normal",
          pace: text.split(/\s+/).length > 18 ? "fast" : "steady",
          energy: /!/.test(text) ? "high" : "moderate",
          confidence: 76,
          note: "Browser demo estimates voice emotion from the speech transcript."
        }
      : null
  };
}

function emojiFor(emotion) {
  return {
    Happy: "😊",
    Confused: "😕",
    Frustrated: "😠",
    Angry: "😡",
    Urgent: "⚡",
    Neutral: "😐"
  }[emotion] || "😐";
}

function riskTone(level) {
  return {
    Low: "bg-emerald-400",
    Medium: "bg-yellow-400",
    High: "bg-orange-400",
    Critical: "bg-red-400"
  }[level] || "bg-emerald-400";
}

function formatTime(value) {
  if (!value) return "--:--";
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function toneFor(emotion) {
  return {
    Angry: { tone: "Calm, accountable", empathy: "Very high", length: "Medium" },
    Frustrated: { tone: "Reassuring", empathy: "High", length: "Medium" },
    Urgent: { tone: "Decisive", empathy: "Medium", length: "Short" },
    Confused: { tone: "Patient", empathy: "High", length: "Step-by-step" },
    Happy: { tone: "Warm", empathy: "Balanced", length: "Short" },
    Neutral: { tone: "Professional", empathy: "Balanced", length: "Medium" }
  }[emotion] || { tone: "Professional", empathy: "Balanced", length: "Medium" };
}

