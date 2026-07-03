import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { detectEmotion } from "../services/emotionService.js";
import { generateAdaptiveReply, summarizeConversation } from "../services/aiService.js";
import { evaluateEscalation } from "../services/escalationService.js";
import {
  buildAgentCoach,
  buildEmotionTimeline,
  buildExplainability,
  estimateVoiceEmotion,
  inferTopic,
  predictEscalation,
  predictResolution
} from "../services/intelligenceService.js";

export const listConversations = asyncHandler(async (req, res) => {
  const query = req.user.role === "admin" ? {} : { user: req.user._id };
  const conversations = await Conversation.find(query).sort({ updatedAt: -1 }).limit(60);
  res.json({ conversations });
});

export const createConversation = asyncHandler(async (req, res) => {
  const conversation = await Conversation.create({
    user: req.user._id,
    title: req.body.title || "New support conversation",
    language: req.body.language || req.user.language
  });
  res.status(201).json({ conversation });
});

export const getConversation = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) return res.status(404).json({ message: "Conversation not found" });
  if (req.user.role !== "admin" && conversation.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Forbidden" });
  }
  const messages = await Message.find({ conversation: conversation._id }).sort({ createdAt: 1 });
  res.json({ conversation, messages });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { content, language, voiceInput } = req.body;
  if (!content?.trim()) return res.status(400).json({ message: "Message content is required" });

  let conversation = req.params.id
    ? await Conversation.findById(req.params.id)
    : await Conversation.create({ user: req.user._id, language: language || req.user.language });

  if (!conversation) return res.status(404).json({ message: "Conversation not found" });
  if (req.user.role !== "admin" && conversation.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const emotion = detectEmotion(content);
  const recentMessages = await Message.find({ conversation: conversation._id, sender: "user" })
    .sort({ createdAt: -1 })
    .limit(6);
  const escalation = evaluateEscalation({ message: content, emotion, recentMessages });
  const ai = await generateAdaptiveReply({ message: content, emotion, language: language || conversation.language });
  const escalationRisk = predictEscalation({ emotion, content, recentMessages, escalation });
  const resolutionPrediction = predictResolution({ emotion, escalationRisk, escalation });
  const explainability = buildExplainability({
    content,
    emotion,
    escalation,
    toneProfile: ai.toneProfile,
    recentMessages
  });
  const topic = inferTopic(content);
  const agentCoach = buildAgentCoach({
    content,
    emotion,
    escalation,
    escalationRisk,
    resolutionPrediction,
    messages: recentMessages
  });
  const voiceEmotion = voiceInput ? estimateVoiceEmotion(content) : undefined;

  const userMessage = await Message.create({
    conversation: conversation._id,
    sender: "user",
    content,
    emotion,
    explainability,
    escalationRisk,
    resolutionPrediction,
    voiceEmotion,
    topic
  });

  const aiMessage = await Message.create({
    conversation: conversation._id,
    sender: "ai",
    content: ai.content,
    emotion,
    toneProfile: ai.toneProfile,
    metadata: ai.metadata
  });

  conversation.currentEmotion = emotion.label;
  conversation.emotionConfidence = emotion.confidence;
  conversation.escalationRisk = escalationRisk;
  conversation.resolutionPrediction = resolutionPrediction;
  conversation.agentCoach = agentCoach;
  conversation.priority = escalation.priority || conversation.priority;
  conversation.status = escalation.shouldEscalate ? "escalated" : conversation.status;
  conversation.lastMessageAt = new Date();
  if (conversation.title === "New support conversation") {
    conversation.title = content.slice(0, 48);
  }
  if (escalation.shouldEscalate) {
    conversation.escalationHistory.push({
      reason: escalation.reason,
      severity: escalation.severity,
      suggestedAction: escalation.suggestedAction
    });
  }
  await conversation.save();
  const timeline = buildEmotionTimeline([...recentMessages.reverse(), userMessage]);

  req.io?.to(`conversation:${conversation._id}`).emit("message:new", {
    userMessage,
    aiMessage,
    conversation,
    intelligence: { timeline, explainability, escalationRisk, resolutionPrediction, agentCoach, voiceEmotion }
  });
  if (escalation.shouldEscalate) req.io?.emit("ticket:escalated", { conversation, escalation, agentCoach });

  res.status(201).json({
    conversation,
    userMessage,
    aiMessage,
    emotion,
    escalation,
    intelligence: { timeline, explainability, escalationRisk, resolutionPrediction, agentCoach, voiceEmotion }
  });
});

export const summarize = asyncHandler(async (req, res) => {
  const messages = await Message.find({ conversation: req.params.id }).sort({ createdAt: 1 });
  const summary = await summarizeConversation(messages);
  await Conversation.findByIdAndUpdate(req.params.id, { summary });
  res.json({ summary });
});

export const submitFeedback = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }

  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) return res.status(404).json({ message: "Conversation not found" });
  if (req.user.role !== "admin" && conversation.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Forbidden" });
  }

  conversation.csatRating = rating;
  conversation.feedbackComment = comment || "";
  conversation.resolutionStatus = rating >= 4 ? "resolved" : "monitoring";
  await conversation.save();

  req.io?.emit("feedback:new", { conversationId: conversation._id, rating });
  res.json({ conversation });
});

export const updateConversationStatus = asyncHandler(async (req, res) => {
  const { status, resolutionStatus, priority, agentNotes, tags } = req.body;
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) return res.status(404).json({ message: "Conversation not found" });

  if (status) conversation.status = status;
  if (resolutionStatus) conversation.resolutionStatus = resolutionStatus;
  if (priority) conversation.priority = priority;
  if (typeof agentNotes === "string") conversation.agentNotes = agentNotes;
  if (Array.isArray(tags)) conversation.tags = tags;
  await conversation.save();

  req.io?.emit("conversation:updated", { conversation });
  res.json({ conversation });
});
