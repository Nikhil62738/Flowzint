import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
    sender: { type: String, enum: ["user", "ai", "system"], required: true },
    content: { type: String, required: true },
    emotion: {
      label: { type: String, default: "Neutral" },
      confidence: { type: Number, default: 0 },
      sentimentScore: { type: Number, default: 0 },
      signals: [String]
    },
    explainability: {
      detectedEmotion: String,
      confidenceScore: Number,
      reasonForClassification: String,
      selectedResponseTone: String,
      escalationDecision: String
    },
    escalationRisk: {
      riskScore: Number,
      riskLevel: { type: String, enum: ["Low", "Medium", "High", "Critical"], default: "Low" },
      likelyInNextMessages: Boolean,
      drivers: [String]
    },
    resolutionPrediction: {
      resolutionProbability: Number,
      satisfactionPrediction: Number,
      rationale: String
    },
    voiceEmotion: {
      enabled: Boolean,
      vocalEmotion: String,
      pitch: String,
      pace: String,
      energy: String,
      confidence: Number,
      note: String
    },
    topic: { type: String, default: "General" },
    toneProfile: {
      tone: String,
      empathyLevel: String,
      responseLength: String,
      urgencyHandling: String,
      professionalism: String
    },
    metadata: {
      latencyMs: Number,
      provider: String,
      model: String
    }
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
