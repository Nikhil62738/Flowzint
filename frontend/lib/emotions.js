export const emotionMeta = {
  Angry: { color: "bg-red-500/15 text-red-700 border-red-400/30 dark:text-red-200", dot: "bg-red-400" },
  Frustrated: { color: "bg-orange-500/15 text-orange-700 border-orange-400/30 dark:text-orange-100", dot: "bg-orange-400" },
  Urgent: { color: "bg-yellow-500/20 text-yellow-700 border-yellow-400/40 dark:text-yellow-100", dot: "bg-yellow-400" },
  Neutral: { color: "bg-sky-500/15 text-sky-700 border-sky-300/30 dark:text-sky-100", dot: "bg-sky-300" },
  Happy: { color: "bg-emerald-500/15 text-emerald-700 border-emerald-300/30 dark:text-emerald-100", dot: "bg-emerald-300" },
  Confused: { color: "bg-violet-500/15 text-violet-700 border-violet-300/30 dark:text-violet-100", dot: "bg-violet-300" }
};

export const fallbackAnalytics = {
  cards: {
    totalConversations: 1284,
    totalUsers: 372,
    escalatedTickets: 38,
    resolvedTickets: 214,
    activeUsers: 46,
    avgSatisfaction: 84,
    avgEscalationRisk: 28,
    avgResolutionProbability: 82,
    avgSatisfactionPrediction: 88
  },
  emotionDistribution: {
    Angry: 64,
    Frustrated: 142,
    Urgent: 93,
    Neutral: 360,
    Happy: 188,
    Confused: 117
  },
  mostFrustratedUsers: [
    { id: "1", name: "Ananya Rao", email: "ananya@example.com", emotion: "Frustrated", confidence: 91, priority: "high" },
    { id: "2", name: "Marcus Lee", email: "marcus@example.com", emotion: "Angry", confidence: 88, priority: "critical" },
    { id: "3", name: "Priya Shah", email: "priya@example.com", emotion: "Urgent", confidence: 82, priority: "high" }
  ],
  responsePerformance: [
    { _id: "gemini", avgLatencyMs: 3900, responses: 64 },
    { _id: "fallback", avgLatencyMs: 12, responses: 18 }
  ],
  conversations: [
    {
      _id: "demo-1",
      title: "Refund not processed after repeated follow-up",
      currentEmotion: "Frustrated",
      emotionConfidence: 91,
      status: "escalated",
      priority: "high",
      csatRating: 2,
      escalationRisk: { riskScore: 62, riskLevel: "High" },
      resolutionPrediction: { resolutionProbability: 54, satisfactionPrediction: 58 },
      user: { name: "Ananya Rao", email: "ananya@example.com" }
    },
    {
      _id: "demo-2",
      title: "Production account locked right now",
      currentEmotion: "Urgent",
      emotionConfidence: 86,
      status: "active",
      priority: "high",
      escalationRisk: { riskScore: 68, riskLevel: "High" },
      resolutionPrediction: { resolutionProbability: 61, satisfactionPrediction: 66 },
      user: { name: "Marcus Lee", email: "marcus@example.com" }
    },
    {
      _id: "demo-3",
      title: "Billing settings are unclear",
      currentEmotion: "Confused",
      emotionConfidence: 78,
      status: "active",
      priority: "normal",
      csatRating: 4,
      escalationRisk: { riskScore: 32, riskLevel: "Medium" },
      resolutionPrediction: { resolutionProbability: 84, satisfactionPrediction: 89 },
      user: { name: "Priya Shah", email: "priya@example.com" }
    }
  ],
  mostFrustratedHours: [
    { hour: 8, angry: 2, frustrated: 7, urgent: 3 },
    { hour: 9, angry: 5, frustrated: 12, urgent: 6 },
    { hour: 10, angry: 8, frustrated: 18, urgent: 9 },
    { hour: 11, angry: 6, frustrated: 14, urgent: 11 },
    { hour: 14, angry: 9, frustrated: 21, urgent: 7 },
    { hour: 16, angry: 12, frustrated: 24, urgent: 10 },
    { hour: 18, angry: 7, frustrated: 13, urgent: 5 }
  ],
  complaintTopics: [
    { topic: "Refund", count: 44 },
    { topic: "Login", count: 37 },
    { topic: "Bug", count: 29 },
    { topic: "Billing", count: 23 },
    { topic: "How-to", count: 18 }
  ],
  emotionTrends: [
    { day: "Jul 1", Angry: 4, Frustrated: 9, Urgent: 5, Confused: 7, Happy: 8, Neutral: 18 },
    { day: "Jul 2", Angry: 6, Frustrated: 13, Urgent: 7, Confused: 8, Happy: 11, Neutral: 21 },
    { day: "Jul 3", Angry: 5, Frustrated: 11, Urgent: 10, Confused: 9, Happy: 13, Neutral: 24 }
  ],
  insights: [
    "Neutral is the dominant customer emotion.",
    "38 conversations require human attention.",
    "214 conversations are marked resolved.",
    "84% average customer satisfaction from submitted ratings."
  ]
};
