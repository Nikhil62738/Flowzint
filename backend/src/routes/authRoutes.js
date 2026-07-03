import express from "express";
import { login, me, register } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

export const authRoutes = express.Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.get("/me", protect, me);
