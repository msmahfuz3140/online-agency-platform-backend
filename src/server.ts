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
import adminRoutes from "./routes/admin.routes.js";
import otpRoutes from "./routes/otp.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import { isCloudinaryConfigured } from "./config/cloudinary.js";
import { autoSeedDatabase } from "./config/seeder.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = Array.from(
  new Set([
    "http://localhost:3000",
    "http://localhost:3001",
    "https://online-agency-platform.vercel.app",
    ...(process.env.CLIENT_URL
      ? [
          process.env.CLIENT_URL.trim(),
          process.env.CLIENT_URL.trim().replace(/\/+$/, ""),
        ]
      : []),
  ])
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-side fetch)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        origin.startsWith("http://localhost:") ||
        origin.endsWith(".vercel.app") ||
        process.env.NODE_ENV !== "production"
      ) {
        return callback(null, true);
      }

      // Permissive fallback so CORS never blocks frontend
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cookie",
      "Accept",
      "X-Requested-With",
    ],
  })
);

// Pre-flight handling
app.options("*", cors());

// Raw body for Stripe webhook (must be before express.json())
app.use("/api/payment/stripe-webhook", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure DB connection for every incoming request in serverless environment
app.use(async (_req: Request, _res: Response, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.warn("DB connection warning in middleware:", err);
  }
  next();
});

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

// Custom OTP routes for registration & email verification
app.use("/api/auth", otpRoutes);

// Better Auth router: check if auth is available or fallback
app.all("/api/auth/*", (req: Request, res: Response, next) => {
  try {
    const auth = getAuth();
    return toNodeHandler(auth.handler)(req, res);
  } catch {
    return authFallbackRoutes(req, res, next);
  }
});

app.all("/api/auth", (req: Request, res: Response, next) => {
  try {
    const auth = getAuth();
    return toNodeHandler(auth.handler)(req, res);
  } catch {
    return authFallbackRoutes(req, res, next);
  }
});

// Application routes (mounted synchronously so serverless functions never 404 on cold start)
app.use("/api/user", userRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/project-request", projectRequestRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/portfolio", projectRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/upload", uploadRoutes);

// Automatically seed services, portfolio projects, team members, and blog posts in background
connectDB()
  .then((connected) => {
    if (connected) {
      autoSeedDatabase().catch((err) =>
        console.warn("Database auto-seed skipped or failed:", err?.message)
      );
    }
  })
  .catch(() => {});

// Start standalone server only when NOT in Vercel Serverless environment
if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📬 Contact route: POST /api/contact | GET /api/contact`);
    console.log(`👤 User route: GET /api/user/me`);
    console.log(`🗂️  Project Request route: POST /api/project-request | GET /api/project-request`);
    console.log(`🔔 Notifications route: GET /api/notifications | PATCH /api/notifications/:id/read`);
    console.log(`💼 Services route: GET /api/services`);
    console.log(`🎨 Portfolio route: GET /api/portfolio`);
    console.log(`👥 Team route: GET /api/team`);
    console.log(`📝 Blog route: GET /api/blog`);
    console.log(`🛡️  Admin route: GET /api/admin/stats | /users | /requests | /messages`);
    console.log(`💳 Payment route: POST /api/payment/create-stripe-intent`);
    console.log(`☁️  Upload route: POST /api/upload | POST /api/upload/multiple | DELETE /api/upload/:publicId`);
    console.log(
      `ℹ️  Cloudinary: ${
        isCloudinaryConfigured()
          ? `configured (${process.env.CLOUDINARY_CLOUD_NAME})`
          : "NOT configured — set CLOUDINARY_* in .env"
      }`
    );
  });
}

export default app;
