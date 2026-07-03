import { getToneProfile } from "./emotionService.js";

const riskWeights = {
  Angry: 34,
  Frustrated: 26,
  Urgent: 22,
  Confused: 14,
  Neutral: 6,
  Happy: -10
};

const topics = [
  { label: "Refund", words: ["refund", "money", "charge", "payment", "billing", "invoice"] },
  { label: "Login", words: ["login", "password", "locked", "account", "signin", "access"] },
  { label: "Bug", words: ["bug", "broken", "error", "crash", "not working", "failed"] },
  { label: "Delivery", words: ["delivery", "shipment", "order", "tracking", "late"] },
  { label: "Plan", words: ["upgrade", "subscription", "plan", "cancel", "renewal"] },
  { label: "How-to", words: ["how do", "help", "confused", "unclear", "setup", "configure"] }
];

export function classifyRisk(score) {
  if (score >= 78) return "Critical";
  if (score >= 55) return "High";
  if (score >= 30) return "Medium";
  return "Low";
}

export function inferTopic(text = "") {
  const lower = text.toLowerCase();
  return topics.find((topic) => topic.words.some((word) => lower.includes(word)))?.label || "General";
}

export function buildExplainability({ content, emotion, escalation, toneProfile, recentMessages = [] }) {
  const reasons = [];
  if (emotion.signals?.length) reasons.push(`matched phrases: ${emotion.signals.join(", ")}`);
  if (/[!]{2,}/.test(content)) reasons.push("strong punctuation indicates elevated intensity");
  if (/[A-Z]{5,}/.test(content)) reasons.push("uppercase wording suggests emotional emphasis");
  if ((content.match(/\?/g) || []).length > 1) reasons.push("multiple questions suggest confusion");
  if (recentMessages.filter((m) => ["Angry", "Frustrated"].includes(m.emotion?.label)).length) {
    reasons.push("recent negative messages increased concern");
  }

  return {
    detectedEmotion: emotion.label,
    confidenceScore: emotion.confidence,
    reasonForClassification: reasons.length ? reasons.join("; ") : "neutral wording with no strong emotional trigger",
    selectedResponseTone: toneProfile.tone,
    escalationDecision: escalation.shouldEscalate ? escalation.reason : "No immediate escalation required"
  };
}

export function predictEscalation({ emotion, content, recentMessages = [], escalation }) {
  const negativeRecent = recentMessages.filter((m) => ["Angry", "Frustrated", "Urgent"].includes(m.emotion?.label)).length;
  const repeatedComplaints = recentMessages.filter((m) => /again|still|same issue|not fixed|broken/i.test(m.content)).length;
  const topic = inferTopic(content);
  let score = 12 + (riskWeights[emotion.label] || 0);

  score += Math.round(emotion.confidence * 0.18);
  score += negativeRecent * 10;
  score += repeatedComplaints * 12;
  if (/asap|urgent|right now|immediately|production/i.test(content)) score += 12;
  if (/scam|fraud|stupid|idiot|worst/i.test(content)) score += 18;
  if (topic === "Refund" || topic === "Login") score += 6;
  if (escalation.shouldEscalate) score = Math.max(score, escalation.severity === "critical" ? 88 : 68);

  const riskScore = Math.max(4, Math.min(97, score));
  return {
    riskScore,
    riskLevel: classifyRisk(riskScore),
    likelyInNextMessages: riskScore >= 55,
    drivers: [
      `${emotion.label} at ${emotion.confidence}% confidence`,
      negativeRecent ? `${negativeRecent} recent negative signal(s)` : "limited negative history",
      `${topic} topic`
    ]
  };
}

export function predictResolution({ emotion, escalationRisk, escalation }) {
  let resolutionProbability = 84;
  resolutionProbability -= escalationRisk.riskScore * 0.35;
  if (["Happy", "Neutral"].includes(emotion.label)) resolutionProbability += 10;
  if (emotion.label === "Confused") resolutionProbability += 4;
  if (escalation.shouldEscalate) resolutionProbability -= 12;
  resolutionProbability = Math.round(Math.max(18, Math.min(96, resolutionProbability)));

  const satisfactionPrediction = Math.round(
    Math.max(20, Math.min(97, resolutionProbability + (emotion.label === "Happy" ? 8 : emotion.sentimentScore * 12)))
  );

  return {
    resolutionProbability,
    satisfactionPrediction,
    rationale:
      resolutionProbability >= 75
        ? "Clear next steps and manageable emotional intensity"
        : "Higher risk signals suggest human follow-up may be needed"
  };
}

export function buildAgentCoach({ content, emotion, escalation, escalationRisk, resolutionPrediction, messages = [] }) {
  const topic = inferTopic(content);
  const previousText = messages.slice(-4).map((m) => m.content).join(" ");
  const summary = `${topic} conversation currently showing ${emotion.label.toLowerCase()} sentiment at ${emotion.confidence}% confidence.`;
  const rootCause = topic === "General"
    ? "Customer needs help resolving the current support request."
    : `Likely ${topic.toLowerCase()} friction based on recent wording.`;
  const predictivePriority =
    escalationRisk.riskLevel === "Critical" ? "critical" : escalationRisk.riskLevel === "High" ? "high" : "normal";

  return {
    conversationSummary: previousText ? `${summary} Recent context: ${previousText.slice(0, 180)}${previousText.length > 180 ? "..." : ""}` : summary,
    rootCause,
    customerMood: `${emotion.label} (${emotion.confidence}%)`,
    suggestedReply:
      escalationRisk.riskLevel === "High" || escalationRisk.riskLevel === "Critical"
        ? "Acknowledge the impact, take ownership, provide one concrete action, and offer human handoff."
        : "Confirm the request, explain the next step clearly, and keep the tone aligned with the customer mood.",
    priorityLevel: escalation.shouldEscalate ? escalation.priority : predictivePriority,
    recommendedNextSteps: [
      "Confirm account or order identifier",
      "Summarize the issue in one sentence",
      escalation.shouldEscalate ? "Assign to a human support agent" : "Continue AI-assisted resolution",
      resolutionPrediction.resolutionProbability < 60 ? "Offer proactive follow-up" : "Ask for confirmation after applying the fix"
    ]
  };
}

export function buildEmotionTimeline(messages = []) {
  return messages
    .filter((message) => message.sender === "user" && message.emotion?.label)
    .slice(-8)
    .map((message) => ({
      id: message._id,
      emotion: message.emotion.label,
      confidence: message.emotion.confidence,
      at: message.createdAt,
      topic: inferTopic(message.content)
    }));
}

export function estimateVoiceEmotion(text = "") {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const exclamations = (text.match(/!/g) || []).length;
  const questions = (text.match(/\?/g) || []).length;
  const pace = words > 18 ? "fast" : words < 5 ? "slow" : "steady";
  const urgentTone = /urgent|right now|asap|frustrated|angry|fix this/i.test(text);
  const energy = exclamations >= 1 || urgentTone ? "high" : questions ? "uncertain" : "moderate";
  const vocalEmotion = exclamations >= 1 || urgentTone ? "stressed" : questions ? "uncertain" : "calm";

  return {
    enabled: true,
    vocalEmotion,
    pitch: energy === "high" ? "elevated" : "normal",
    pace,
    energy,
    confidence: Math.min(88, 58 + words + exclamations * 8 + questions * 4),
    note: "Browser demo estimates vocal emotion from transcript intensity, length, punctuation, and pace proxies."
  };
}
