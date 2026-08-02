require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");

const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

const passport = require('./config/passport');

const authRoutes = require("./routes/authRoutes");
const channelRoutes = require("./routes/channelRoutes");
const registerChatHandlers = require("./sockets/chatSocket");


const app = express();

app.use(express.json());
app.use(cookieParser());   // still needed — refresh token lives in a cookie
app.use(passport.initialize());
// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

// Connect DB
connectDB();
// NOTE: sessionMiddleware is gone — no more req.session anywhere

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

// Socket auth is now MUCH simpler than the session-sharing trick from Phase 4 —
// the client sends the access token directly at connect time.

// Protect socket connections
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }
  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
    socket.user = decoded; // Attach user info to socket object
    next();
  });
});


// Register socket handlers
registerChatHandlers(io);

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});