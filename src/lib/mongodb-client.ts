import { MongoClient, ServerApiVersion } from "mongodb";

if (!process.env.MONGODB_URI && process.env.NODE_ENV === "production") {
  console.warn("MONGODB_URI is missing from environment variables. Database operations will fail.");
}

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/dummy_build_time_db";
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  connectTimeoutMS: 5000, // Fail fast in 5 seconds
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable to preserve the value
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect().catch(err => {
      console.error("MongoDB connection failed in development:", err.message);
      throw err;
    });
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect().catch(err => {
    console.error("MongoDB connection failed in production:", err.message);
    // Don't crash the whole app just because one connection failed;
    // Database-dependent operations will fail later when they await this promise.
    throw err;
  });
}

// Export a module-scoped MongoClient promise.
export default clientPromise;
