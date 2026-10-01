import mongoose from "mongoose";
import { config } from "./config.js";

const memory = new Map();

const CacheSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, index: true },
    value: mongoose.Schema.Types.Mixed,
    expiresAt: { type: Date, index: true },
  },
  { timestamps: true }
);

const CacheModel = mongoose.models.Cache || mongoose.model("Cache", CacheSchema);

export let mongoReady = false;

export async function connectDb() {
  try {
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 2500 });
    mongoReady = true;
    console.log("MongoDB connected");
  } catch (err) {
    mongoReady = false;
    console.warn("MongoDB unavailable, using in-memory cache:", err.message);
  }
}

export async function cacheGet(key) {
  if (mongoReady) {
    const row = await CacheModel.findOne({ key, expiresAt: { $gt: new Date() } }).lean();
    return row ? row.value : null;
  }
  const hit = memory.get(key);
  if (!hit || hit.expiresAt < Date.now()) {
    memory.delete(key);
    return null;
  }
  return hit.value;
}

export async function cacheSet(key, value, ttlMs) {
  const expiresAt = new Date(Date.now() + ttlMs);
  if (mongoReady) {
    await CacheModel.findOneAndUpdate(
      { key },
      { value, expiresAt },
      { upsert: true }
    );
    return;
  }
  memory.set(key, { value, expiresAt: expiresAt.getTime() });
}
