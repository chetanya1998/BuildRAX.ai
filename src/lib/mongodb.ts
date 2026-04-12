import mongoose from "mongoose";

// Provide a fallback URI during build time so `next build` does not crash
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/dummy";

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
// @ts-ignore
let cached = global.mongoose;

if (!cached) {
  // @ts-ignore
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      // Fail fast on serverless cold-starts; don't leave zombie connections
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      socketTimeoutMS: 30000,
      // Required for MongoDB Atlas TLS connections
      tls: true,
      // IPv4 only — avoids IPv6 resolution delays in Lambda/Vercel
      family: 4,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      if (process.env.NODE_ENV !== "development") {
        console.log("[mongodb] connected to Atlas");
      }
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    // Reset so the next request gets a fresh connection attempt
    cached.promise = null;
    cached.conn = null;
    if (process.env.NODE_ENV !== "development") {
      console.error("[mongodb] connection failed:", (e as Error).message);
    }
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
