import mongoose from "mongoose";

let isConnected = false;

export async function connectDB(): Promise<boolean> {
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return true;
  }

  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/agency-platform";

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    });
    isConnected = true;
    console.log("✅ MongoDB connected successfully");
    return true;
  } catch (error: any) {
    console.warn(
      `⚠️ MongoDB connection not established (${error?.message || "offline"}). Server will continue running.`
    );
    isConnected = false;
    return false;
  }
}

export function getMongoClient() {
  if (mongoose.connection.readyState !== 1) {
    throw new Error("MongoDB is not connected yet. Call connectDB() first.");
  }
  // Share the underlying raw MongoDB client with Better Auth
  return mongoose.connection.getClient();
}

export default mongoose;

