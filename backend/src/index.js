require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');

const decisionRoutes = require('./routes/decisions');
const moodRoutes = require('./routes/moods');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:19006',
    'http://localhost:19006',
    'http://localhost:8081',
    'http://localhost:8000'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API info route
app.get('/api', (req, res) => {
  res.json({ 
    message: 'LifeLens API is running',
    version: '1.0.0',
    availableRoutes: [
      '/api/auth/*',
      '/api/decisions/*',
      '/api/moods/*',
      '/api/users/*'
    ]
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/decisions', decisionRoutes);
app.use('/api/moods', moodRoutes);
app.use('/api/users', userRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`LifeLens backend running on port ${PORT}`);
});