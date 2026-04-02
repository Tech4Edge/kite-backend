import mongoose from "mongoose";

let cachedConnection = null;
let cachedConnectionPromise = null;

function getMongoUri() {
  return (
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.MONGODB_URL ||
    "mongodb://127.0.0.1:27017/kite"
  );
}

export async function connectToDatabase() {
  if (cachedConnection) {
    return cachedConnection;
  }

  if (cachedConnectionPromise) {
    return cachedConnectionPromise;
  }

  const mongoUri = getMongoUri();

  cachedConnectionPromise = mongoose
    .connect(mongoUri)
    .then((conn) => {
      cachedConnection = conn;
      console.log("MongoDB connected");
      return conn;
    })
    .catch((err) => {
      cachedConnectionPromise = null;
      if (String(err?.message || "").includes("ECONNREFUSED")) {
        console.error(
          `MongoDB is not reachable at ${mongoUri}. Start MongoDB service or set MONGODB_URI to a running instance (Atlas/local).`,
        );
      }
      throw err;
    });

  return cachedConnectionPromise;
}
