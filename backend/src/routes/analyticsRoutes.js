import express from "express";
import { dashboard } from "../controllers/analyticsController.js";
import { protect, requireRole } from "../middleware/auth.js";

export const analyticsRoutes = express.Router();

analyticsRoutes.get("/dashboard", protect, requireRole("admin", "agent"), dashboard);
