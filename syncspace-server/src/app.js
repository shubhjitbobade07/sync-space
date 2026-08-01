require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const channelRoutes = require('./routes/channelRoutes');

const app = express();
// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,   // signs the session ID cookie
  resave: false,                        // don't re-save session if nothing changed
  saveUninitialized: false,             // don't create a session until something is stored in it
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: {
    httpOnly: true,                     // JS on the client can't read this cookie (blocks XSS token theft)
    secure: false,                      // set true in production (HTTPS only)
    sameSite: 'lax',                    // CSRF mitigation — cookie not sent on most cross-site requests
    maxAge: 1000 * 60 * 60 * 24         // 1 day
  }
}));

app.use('/api/auth', authRoutes);
app.use('/api/channels', channelRoutes);

app.get('/', (req, res) => {
  res.send('SyncSpace API is alive');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
