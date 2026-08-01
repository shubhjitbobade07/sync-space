require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const sessionMiddleware = require("./middleware/session");

const authRoutes = require("./routes/authRoutes");
const channelRoutes = require("./routes/channelRoutes");
const registerChatHandlers = require("./sockets/chatSocket");

const app = express();

// Connect DB
connectDB();

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(sessionMiddleware);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/channels", channelRoutes);

app.get("/", (req, res) => {
  res.send("SyncSpace API is alive");
});

// HTTP Server
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

// Share Express session with Socket.IO
const wrap = (middleware) => (socket, next) =>
  middleware(socket.request, {}, next);

io.use(wrap(sessionMiddleware));

// Protect socket connections
io.use((socket, next) => {
  if (socket.request.session?.userId) {
    return next();
  }

  next(new Error("Unauthorized"));
});

// Register socket handlers
registerChatHandlers(io);

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});