// api/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const translateRoutes = require('./routes/translate');
const uploadRoutes = require('./routes/upload');
const modelsRoutes = require('./routes/models');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files in development
if (process.env.NODE_ENV !== 'production') {
  app.use(express.static(path.join(__dirname, '../public')));
}

// API Routes
app.use('/api/translate', translateRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/models', modelsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server (for local development)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
