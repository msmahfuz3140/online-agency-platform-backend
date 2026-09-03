import mongoose from "mongoose";

let isConnected = false;

export async function connectDB(): Promise<boolean> {
  if (isConnected) {
    console.log("⚡ Using existing MongoDB connection");
    return true;
  }

  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/agency-platform";

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000, connectTimeoutMS: 2000 });
    isConnected = true;
    console.log("✅ MongoDB connected successfully to:", uri);
    return true;
  } catch (error: any) {
    console.warn(`⚠️ MongoDB connection not established (${error?.message || "offline"}). Server will continue running.`);
    isConnected = false;
    return false;
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
