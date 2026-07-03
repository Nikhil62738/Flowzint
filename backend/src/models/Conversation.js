import mongoose from "mongoose";

const escalationSchema = new mongoose.Schema(
  {
    reason: String,
    severity: { type: String, enum: ["medium", "high", "critical"], default: "high" },
    status: { type: String, enum: ["open", "assigned", "resolved"], default: "open" },
    suggestedAction: String
  },
  { timestamps: true }
);

const conversationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, default: "New support conversation" },
    status: { type: String, enum: ["active", "escalated", "closed"], default: "active" },
    priority: { type: String, enum: ["low", "normal", "high", "critical"], default: "normal" },
    currentEmotion: { type: String, default: "Neutral" },
    emotionConfidence: { type: Number, default: 0 },
    language: { type: String, default: "en" },
    summary: { type: String, default: "" },
    escalationRisk: {
      riskScore: { type: Number, default: 12 },
      riskLevel: { type: String, enum: ["Low", "Medium", "High", "Critical"], default: "Low" },
      likelyInNextMessages: { type: Boolean, default: false },
      drivers: [String]
    },
    resolutionPrediction: {
      resolutionProbability: { type: Number, default: 84 },
      satisfactionPrediction: { type: Number, default: 82 },
      rationale: String
    },
    agentCoach: {
      conversationSummary: String,
      rootCause: String,
      customerMood: String,
      suggestedReply: String,
      priorityLevel: String,
      recommendedNextSteps: [String]
    },
    csatRating: { type: Number, min: 1, max: 5 },
    feedbackComment: { type: String, default: "" },
    resolutionStatus: { type: String, enum: ["unresolved", "monitoring", "resolved"], default: "unresolved" },
    tags: [String],
    agentNotes: { type: String, default: "" },
    escalationHistory: [escalationSchema],
    lastMessageAt: Date
  },
  { timestamps: true }
);

export const Conversation = mongoose.model("Conversation", conversationSchema);
