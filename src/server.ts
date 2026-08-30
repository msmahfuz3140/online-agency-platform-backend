import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { getAuth } from "./config/auth.js";
import { toNodeHandler } from "better-auth/node";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Route
app.get("/", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "AI Agency Platform Backend API is running",
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Bootstrap: connect DB first, then mount Better Auth and start server
async function bootstrap() {
  await connectDB();

  // Mount Better Auth routes at /api/auth/*
  // Better Auth handles all auth routes internally (login, register, logout, session, etc.)
  const auth = getAuth();
  app.all("/api/auth/*splat", toNodeHandler(auth.handler));

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔐 Auth routes available at http://localhost:${PORT}/api/auth`);
  });
}

bootstrap().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});

export default app;
