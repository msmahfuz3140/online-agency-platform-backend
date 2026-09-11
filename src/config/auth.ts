import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { getMongoClient } from "./db.js";

const DB_NAME = process.env.MONGODB_DB_NAME || "agency-platform";

export function createAuth() {
  const client = getMongoClient();
  const db = client.db(DB_NAME);

  const socialProviders: Record<string, any> = {};

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    socialProviders.google = {
      clientId: process.env.GOOGLE_CLIENT_ID.trim(),
      clientSecret: process.env.GOOGLE_CLIENT_SECRET.trim(),
    };
  }

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    socialProviders.github = {
      clientId: process.env.GITHUB_CLIENT_ID.trim(),
      clientSecret: process.env.GITHUB_CLIENT_SECRET.trim(),
    };
  }

  return betterAuth({
    database: mongodbAdapter(db),
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5000",
    secret:
      process.env.BETTER_AUTH_SECRET ||
      "nexora_agency_super_secret_auth_key_2025_prod_dev_32chars",
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    socialProviders:
      Object.keys(socialProviders).length > 0 ? socialProviders : undefined,
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24,       // Refresh session if older than 1 day
    },
    trustedOrigins: Array.from(
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
    ),
    // Extend the built-in user table with our custom fields
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: false,
          defaultValue: "user",
          input: false, // not accepted from client on sign-up
        },
        aiCreditsRemaining: {
          type: "number",
          required: false,
          defaultValue: 5,
          input: false, // not accepted from client on sign-up
        },
      },
    },
  });
}

// Singleton — initialized after DB connects
let authInstance: ReturnType<typeof createAuth> | null = null;

export function getAuth() {
  if (!authInstance) {
    authInstance = createAuth();
  }
  return authInstance;
}
