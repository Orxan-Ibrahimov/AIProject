import http from "http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { config } from "./config.js";
import { connectDb } from "./db.js";
import { registerRoutes } from "./routes.js";
import { startPoller } from "./poller.js";

const app = express();
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());

registerRoutes(app);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: config.clientOrigin },
});

io.on("connection", (socket) => {
  socket.on("watch:fixture", (id) => {
    socket.join(`fixture:${id}`);
  });
  socket.on("unwatch:fixture", (id) => {
    socket.leave(`fixture:${id}`);
  });
});

await connectDb();
startPoller(io);

server.listen(config.port, () => {
  console.log(`MatchPulse API on http://localhost:${config.port}`);
});
