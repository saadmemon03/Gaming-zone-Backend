import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./db/connect.js";

import authRoutes      from "./routes/auth.routes.js";
import usersRoutes     from "./routes/users.routes.js";
import stationsRoutes  from "./routes/stations.routes.js";
import gamesRoutes     from "./routes/games.routes.js";
import bookingsRoutes  from "./routes/bookings.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

const app = express();

app.use(cors({ 
  origin: ["http://localhost:5173", "https://gaming-zone-frontend-six.vercel.app/", "http://127.0.0.1:5173", process.env.CLIENT_URL], 
  credentials: true 
}));

app.use(express.json());

connectDB().then(() => {
  app.listen(process.env.PORT || 5000, () =>
    console.log(` Server: http://localhost:${process.env.PORT || 5000}`)
  );
}

);

app.use("/api/auth",      authRoutes);
app.use("/api/users",     usersRoutes);
app.use("/api/stations",  stationsRoutes);
app.use("/api/games",     gamesRoutes);
app.use("/api/bookings",  bookingsRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Gaming API", time: new Date().toISOString() });
});

app.use((_req, res) => res.status(404).json({ success: false, message: "Route not found" }));
app.use((err, _req, res, _next) => res.status(500).json({ success: false, message: err.message }));

