import cors from "cors";
import express from "express";
import helmet from "helmet";
import http from "http";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { Server } from "socket.io";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { authRoutes } from "./routes/authRoutes.js";
import { conversationRoutes } from "./routes/conversationRoutes.js";
import { analyticsRoutes } from "./routes/analyticsRoutes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { registerSocket } from "./socket/index.js";

const app = express();
const server = http.createServer(app);
const allowedPreviewHosts = [/^https:\/\/[a-z0-9-]+\.netlify\.app$/i];
const corsOptions = {
  origin(origin, callback) {
    const normalizedOrigin = origin?.replace(/\/+$/, "");
    if (!normalizedOrigin || env.clientUrls.includes(normalizedOrigin)) return callback(null, true);
    if (allowedPreviewHosts.some((pattern) => pattern.test(normalizedOrigin))) return callback(null, true);
    if (env.nodeEnv !== "production" && /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(origin)) {
      return callback(null, true);
    }
    console.warn(`CORS blocked origin: ${origin}. Allowed: ${env.clientUrls.join(", ")}`);
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};
const io = new Server(server, {
  cors: corsOptions
});

app.use(helmet());
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.use(rateLimit({ windowMs: 60_000, max: 120 }));
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.get("/health", (req, res) => res.json({ status: "ok", service: "emotion-aware-care-agent" }));
app.use("/api/auth", authRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use(notFound);
app.use(errorHandler);

registerSocket(io);

connectDatabase()
  .then(() => {
    server.listen(env.port, () => console.log(`API listening on http://localhost:${env.port}`));
  })
  .catch((error) => {
    console.error("Failed to start API", error);
    process.exit(1);
  });
