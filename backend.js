require('dotenv').config();

// ── Fail fast on missing critical env vars ────────────────────
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not defined in .env — server will not start.');
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/project-backend';
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const authRoutes = require('./Route/authRoute');
const articleRoutes = require('./Route/articleRoute');
const aiRoutes = require('./Route/aiRoute');
const searchRoutes = require('./Route/searchRoute');
const bookmarkRoutes = require('./Route/bookmarkRoute');
const historyRoutes = require('./Route/historyRoute');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.send('Backend is running!');
});

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/history', historyRoutes);

// Serve the phone-friendly Expo web build from the same HTTPS Render service.
const webDist = path.join(__dirname, 'ConstitutAImain', 'ConstitutAImainn', 'dist');
app.use(express.static(webDist));
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(webDist, 'index.html'));
});

// ── 404 handler (must be after all routes) ────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Centralised error handler ─────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Something went wrong' });
});

// ── Start server LAST ─────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Server is reachable from Expo Go at http://172.20.10.2:${PORT}`);
});