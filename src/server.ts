import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { getAuth } from "./config/auth.js";
import { toNodeHandler } from "better-auth/node";
import userRoutes from "./routes/user.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import projectRequestRoutes from "./routes/project-request.routes.js";
import authFallbackRoutes from "./routes/auth-fallback.routes.js";
import serviceRoutes from "./routes/service.routes.js";
import projectRoutes from "./routes/project.routes.js";
import teamRoutes from "./routes/team.routes.js";
import blogRoutes from "./routes/blog.routes.js";
import { autoSeedDatabase } from "./config/seeder.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
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

// Bootstrap: connect DB first, then mount routes and start server
async function bootstrap() {
  const dbConnected = await connectDB();

  // Better Auth handles all auth routes if DB is connected, with dev fallback
  if (dbConnected) {
    try {
      const auth = getAuth();
      app.all("/api/auth/*", toNodeHandler(auth.handler));
      app.all("/api/auth", toNodeHandler(auth.handler));
      console.log(
        "🔐 Better Auth live: POST /api/auth/sign-up/email | POST /api/auth/sign-in/email | POST /api/auth/sign-out"
      );
    } catch (authErr) {
      console.warn("⚠️ Better Auth initialization deferred, using dev fallback:", authErr);
      app.use("/api/auth", authFallbackRoutes);
    }

    // Automatically seed services, portfolio projects, team members, and blog posts
    await autoSeedDatabase();
  } else {
    console.log("ℹ️ Better Auth fallback router mounted (ready for testing without live MongoDB).");
    app.use("/api/auth", authFallbackRoutes);
  }

  // Application routes
  app.use("/api/user", userRoutes);
  app.use("/api/contact", contactRoutes);
  app.use("/api/project-request", projectRequestRoutes);
  app.use("/api/services", serviceRoutes);
  app.use("/api/portfolio", projectRoutes);
  app.use("/api/team", teamRoutes);
  app.use("/api/blog", blogRoutes);

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📬 Contact route: POST /api/contact | GET /api/contact`);
    console.log(`👤 User route: GET /api/user/me`);
    console.log(`🗂️  Project Request route: POST /api/project-request | GET /api/project-request`);
    console.log(`💼 Services route: GET /api/services`);
    console.log(`🎨 Portfolio route: GET /api/portfolio`);
    console.log(`👥 Team route: GET /api/team`);
    console.log(`📝 Blog route: GET /api/blog`);
  });
}

bootstrap().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});

export default app;
