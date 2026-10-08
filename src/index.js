import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import connectDB from "./db/connect.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { initChatSocket } from "./socket/chatSocket.js";

import authRoutes      from "./routes/auth.routes.js";
import usersRoutes     from "./routes/users.routes.js";
import stationsRoutes  from "./routes/stations.routes.js";
import gamesRoutes     from "./routes/games.routes.js";
import bookingsRoutes  from "./routes/bookings.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import chatRoutes      from "./routes/chat.routes.js";

const app = express();
const httpServer = createServer(app);
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://gaming-zone-frontend-six.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

// Socket.io initialization
const io = new Server(httpServer, {
  maxHttpBufferSize: 1e7, // 10MB
  cors: {
    origin: allowedOrigins,
    credentials: true,
  }
});
initChatSocket(io);

// Security Middlewares
app.use(helmet());
app.use(morgan("dev"));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

connectDB().then(() => {
  httpServer.listen(process.env.PORT || 5000, () =>
    console.log(` Server: http://localhost:${process.env.PORT || 5000}`)
  );
});

app.use("/api/auth",      authRoutes);
app.use("/api/users",     usersRoutes);
app.use("/api/stations",  stationsRoutes);
app.use("/api/games",     gamesRoutes);
app.use("/api/bookings",  bookingsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/chat",      chatRoutes);

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Gaming API", time: new Date().toISOString() });
});

app.use((_req, res) => res.status(404).json({ success: false, message: "Route not found" }));
app.use((err, _req, res, _next) => res.status(500).json({ success: false, message: err.message }));
