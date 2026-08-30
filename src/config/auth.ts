import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { getMongoClient } from "./db.js";

const DB_NAME = process.env.MONGODB_DB_NAME || "agency-platform";

export function createAuth() {
  const client = getMongoClient();
  const db = client.db(DB_NAME);

  return betterAuth({
    database: mongodbAdapter(db),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24,       // Refresh session if older than 1 day
    },
    trustedOrigins: [
      process.env.CLIENT_URL || "http://localhost:3000",
    ],
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
