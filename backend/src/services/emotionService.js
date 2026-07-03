const EMOTIONS = ["Angry", "Frustrated", "Urgent", "Neutral", "Happy", "Confused"];

const lexicon = {
  Angry: ["angry", "furious", "ridiculous", "unacceptable", "terrible", "hate", "worst", "useless"],
  Frustrated: ["again", "still", "not working", "broken", "annoyed", "frustrated", "tired", "disappointed"],
  Urgent: ["urgent", "asap", "immediately", "right now", "critical", "deadline", "emergency", "quickly"],
  Happy: ["thanks", "great", "awesome", "perfect", "happy", "love", "excellent", "appreciate"],
  Confused: ["confused", "don't understand", "unclear", "how do", "what does", "lost", "help me", "?"]
};

export function detectEmotion(text = "") {
  const normalized = text.toLowerCase();
  const scores = Object.fromEntries(EMOTIONS.map((emotion) => [emotion, emotion === "Neutral" ? 1 : 0]));
  const signals = [];

  Object.entries(lexicon).forEach(([emotion, words]) => {
    words.forEach((word) => {
      if (normalized.includes(word)) {
        scores[emotion] += 2;
        signals.push(word);
      }
    });
  });

  if (/[!]{2,}/.test(text) || /[A-Z]{5,}/.test(text)) scores.Angry += 2;
  if (/\b(now|today|fast)\b/i.test(text)) scores.Urgent += 1;
  if ((text.match(/\?/g) || []).length > 1) scores.Confused += 2;

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [label, topScore] = sorted[0];
  const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const confidence = Math.min(96, Math.max(52, Math.round((topScore / total) * 100 + topScore * 7)));
  const negative = scores.Angry + scores.Frustrated;
  const positive = scores.Happy;

  return {
    label,
    confidence,
    sentimentScore: Number(((positive - negative) / Math.max(1, positive + negative + scores.Confused)).toFixed(2)),
    signals: signals.slice(0, 6)
  };
}

export function getToneProfile(emotion) {
  const profiles = {
    Angry: {
      tone: "calm and accountable",
      empathyLevel: "very high",
      responseLength: "medium",
      urgencyHandling: "acknowledge impact and de-escalate",
      professionalism: "executive support"
    },
    Frustrated: {
      tone: "reassuring and solution-first",
      empathyLevel: "high",
      responseLength: "medium",
      urgencyHandling: "remove friction and offer next step",
      professionalism: "support specialist"
    },
    Urgent: {
      tone: "concise and decisive",
      empathyLevel: "medium",
      responseLength: "short",
      urgencyHandling: "prioritize immediate action",
      professionalism: "incident response"
    },
    Confused: {
      tone: "patient and clarifying",
      empathyLevel: "high",
      responseLength: "step-by-step",
      urgencyHandling: "reduce ambiguity",
      professionalism: "educational support"
    },
    Happy: {
      tone: "warm and appreciative",
      empathyLevel: "medium",
      responseLength: "short",
      urgencyHandling: "keep momentum",
      professionalism: "friendly SaaS"
    },
    Neutral: {
      tone: "professional and clear",
      empathyLevel: "balanced",
      responseLength: "medium",
      urgencyHandling: "standard handling",
      professionalism: "business support"
    }
  };

  return profiles[emotion] || profiles.Neutral;
}
