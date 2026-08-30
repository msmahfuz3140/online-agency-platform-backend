import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in environment variables");
}

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) {
    console.log("⚡ Using existing MongoDB connection");
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI as string);
    isConnected = true;
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
}

export function getMongoClient() {
  if (!isConnected) {
    throw new Error("MongoDB is not connected yet. Call connectDB() first.");
  }
  // Share the underlying raw MongoDB client with Better Auth
  return mongoose.connection.getClient();
}

export default mongoose;
