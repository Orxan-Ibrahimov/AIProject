import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const config = {
  port: Number(process.env.PORT || 5050),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/matchpulse",
  apiKey: process.env.API_FOOTBALL_KEY || "",
  timezone: process.env.TIMEZONE || "Asia/Baku",
  apiBase: "https://v3.football.api-sports.io",
};
