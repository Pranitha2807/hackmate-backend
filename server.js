import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import aiRoutes from "./routes/aiRoutes.js";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Create HTTP Server
const server = http.createServer(app);

// Create Socket.IO Server
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://hackmate-frontend-psi.vercel.app",
    ],
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/ai", aiRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("🚀 HackMate Backend Running");
});

// ================= Socket.IO =================
io.on("connection", (socket) => {
  console.log("🟢 User Connected:", socket.id);

  // Join a team's chat room
  socket.on("joinRoom", (teamId) => {
    socket.join(teamId);
    console.log(`📌 ${socket.id} joined room ${teamId}`);
  });

  // Send message to everyone in that team
  socket.on("sendMessage", (data) => {
    io.to(data.teamId).emit("receiveMessage", data);
  });

  socket.on("disconnect", () => {
    console.log("🔴 User Disconnected:", socket.id);
  });
});

// Start Server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});