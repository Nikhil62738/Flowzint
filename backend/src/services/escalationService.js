const abusiveWords = ["idiot", "stupid", "worthless", "scam", "fraud"];

export function evaluateEscalation({ message, emotion, recentMessages = [] }) {
  const text = message.toLowerCase();
  const abusiveLanguage = abusiveWords.some((word) => text.includes(word));
  const recentNegative = recentMessages.filter((item) =>
    ["Angry", "Frustrated"].includes(item.emotion?.label)
  ).length;
  const repeatedComplaints = recentMessages.filter((item) =>
    /again|still|not fixed|same issue|broken/i.test(item.content)
  ).length;

  if (abusiveLanguage) {
    return {
      shouldEscalate: true,
      severity: "critical",
      priority: "critical",
      reason: "Abusive or high-risk language detected",
      suggestedAction: "Route to senior human agent and preserve full context."
    };
  }

  if ((emotion.label === "Angry" && emotion.confidence >= 70) || recentNegative >= 2) {
    return {
      shouldEscalate: true,
      severity: "high",
      priority: "high",
      reason: "Sustained anger or frustration detected",
      suggestedAction: "Human intervention recommended within 5 minutes."
    };
  }

  if (emotion.label === "Urgent" && emotion.confidence >= 72) {
    return {
      shouldEscalate: true,
      severity: "medium",
      priority: "high",
      reason: "Urgent customer request detected",
      suggestedAction: "Prioritize response and monitor SLA."
    };
  }

  if (repeatedComplaints >= 2) {
    return {
      shouldEscalate: true,
      severity: "high",
      priority: "high",
      reason: "Repeated unresolved complaint pattern",
      suggestedAction: "Assign to human specialist with previous attempts summarized."
    };
  }

  return { shouldEscalate: false, priority: "normal" };
}
