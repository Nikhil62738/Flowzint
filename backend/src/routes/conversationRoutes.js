import express from "express";
import {
  createConversation,
  getConversation,
  listConversations,
  sendMessage,
  submitFeedback,
  summarize,
  updateConversationStatus
} from "../controllers/conversationController.js";
import { protect, requireRole } from "../middleware/auth.js";

export const conversationRoutes = express.Router();

conversationRoutes.use(protect);
conversationRoutes.get("/", listConversations);
conversationRoutes.post("/", createConversation);
conversationRoutes.post("/message", sendMessage);
conversationRoutes.get("/:id", getConversation);
conversationRoutes.post("/:id/message", sendMessage);
conversationRoutes.post("/:id/summary", summarize);
conversationRoutes.post("/:id/feedback", submitFeedback);
conversationRoutes.patch("/:id/status", requireRole("admin", "agent"), updateConversationStatus);
