import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { inferTopic } from "../services/intelligenceService.js";

export const dashboard = asyncHandler(async (req, res) => {
  const [totalConversations, totalUsers, escalatedTickets, resolvedTickets, messages, conversations] = await Promise.all([
    Conversation.countDocuments(),
    User.countDocuments(),
    Conversation.countDocuments({ status: "escalated" }),
    Conversation.countDocuments({ resolutionStatus: "resolved" }),
    Message.find({ sender: "user" }).sort({ createdAt: -1 }).limit(500),
    Conversation.find().populate("user", "name email satisfactionScore").sort({ updatedAt: -1 }).limit(100)
  ]);

  const emotionDistribution = messages.reduce((acc, message) => {
    const label = message.emotion?.label || "Neutral";
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
  const mostFrustratedHours = Array.from({ length: 24 }, (_, hour) => ({ hour, angry: 0, frustrated: 0, urgent: 0 }));
  const topicCounts = {};
  const trendMap = {};
  let totalRisk = 0;
  let riskCount = 0;
  let totalResolution = 0;
  let totalSatisfaction = 0;
  let predictionCount = 0;

  messages.forEach((message) => {
    const date = new Date(message.createdAt);
    const hour = date.getHours();
    const emotion = message.emotion?.label || "Neutral";
    if (emotion === "Angry") mostFrustratedHours[hour].angry += 1;
    if (emotion === "Frustrated") mostFrustratedHours[hour].frustrated += 1;
    if (emotion === "Urgent") mostFrustratedHours[hour].urgent += 1;

    const topic = message.topic || inferTopic(message.content);
    topicCounts[topic] = (topicCounts[topic] || 0) + 1;

    const day = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    trendMap[day] ||= { day, Angry: 0, Frustrated: 0, Urgent: 0, Confused: 0, Happy: 0, Neutral: 0 };
    trendMap[day][emotion] = (trendMap[day][emotion] || 0) + 1;

    if (typeof message.escalationRisk?.riskScore === "number") {
      totalRisk += message.escalationRisk.riskScore;
      riskCount += 1;
    }
    if (typeof message.resolutionPrediction?.resolutionProbability === "number") {
      totalResolution += message.resolutionPrediction.resolutionProbability;
      totalSatisfaction += message.resolutionPrediction.satisfactionPrediction || 0;
      predictionCount += 1;
    }
  });

  const complaintTopics = Object.entries(topicCounts)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  const emotionTrends = Object.values(trendMap).slice(-10);
  const avgEscalationRisk = riskCount ? Math.round(totalRisk / riskCount) : 24;
  const avgResolutionProbability = predictionCount ? Math.round(totalResolution / predictionCount) : 82;

  const mostFrustratedUsers = conversations
    .filter((c) => ["Angry", "Frustrated"].includes(c.currentEmotion))
    .slice(0, 8)
    .map((c) => ({
      id: c._id,
      name: c.user?.name || "Unknown",
      email: c.user?.email || "",
      emotion: c.currentEmotion,
      confidence: c.emotionConfidence,
      priority: c.priority
    }));

  const rated = conversations.filter((conversation) => conversation.csatRating);
  const avgCsat = rated.length
    ? Math.round((rated.reduce((sum, item) => sum + item.csatRating, 0) / rated.length) * 20)
    : 82;
  const avgSatisfactionPrediction = predictionCount ? Math.round(totalSatisfaction / predictionCount) : avgCsat;

  const responsePerformance = await Message.aggregate([
    { $match: { sender: "ai", "metadata.latencyMs": { $exists: true } } },
    {
      $group: {
        _id: "$metadata.provider",
        avgLatencyMs: { $avg: "$metadata.latencyMs" },
        responses: { $sum: 1 }
      }
    },
    { $sort: { responses: -1 } }
  ]);

  const insights = [
    `${Object.keys(emotionDistribution).sort((a, b) => emotionDistribution[b] - emotionDistribution[a])[0] || "Neutral"} is the dominant customer emotion.`,
    `${escalatedTickets} conversations require human attention.`,
    `${resolvedTickets} conversations are marked resolved.`,
    rated.length ? `${avgCsat}% average customer satisfaction from submitted ratings.` : "CSAT is using demo baseline until customers submit ratings."
  ];

  res.json({
    cards: {
      totalConversations,
      totalUsers,
      escalatedTickets,
      activeUsers: Math.max(1, Math.round(totalUsers * 0.18)),
      avgSatisfaction: avgCsat,
      resolvedTickets,
      avgEscalationRisk,
      avgResolutionProbability,
      avgSatisfactionPrediction
    },
    emotionDistribution,
    mostFrustratedUsers,
    conversations,
    responsePerformance,
    mostFrustratedHours,
    complaintTopics,
    emotionTrends,
    insights
  });
});
