import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import winston from 'winston';

import decisionRoutes from './routes/decisions';
import moodRoutes from './routes/moods';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import errorHandler from './middleware/errorHandler';
import { redisClient } from './config/redis';
import { ApiResponse, HealthCheckResponse } from './types';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({
      filename: 'error.log',
      level: 'error'
    })
  ]
});

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
    },
  },
}));

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:19006',
    'http://localhost:19006',
    'http://localhost:8081',
    'http://localhost:8000',
    'exp://localhost:19000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  
  next();
});

// Health check endpoint with comprehensive service status
app.get('/health', async (req, res) => {
  const start = Date.now();
  
  try {
    // Check database connection
    const dbHealthy = await checkDatabaseHealth();
    
    // Check Redis connection
    const redisHealthy = await redisClient.ping();
    
    // Check external APIs (non-blocking)
    const externalAPIs = await checkExternalAPIs();
    
    const healthResponse: ApiResponse<HealthCheckResponse> = {
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        services: {
          database: {
            status: dbHealthy ? 'connected' : 'disconnected',
            response_time_ms: dbHealthy ? Date.now() - start : undefined
          },
          redis: {
            status: redisHealthy ? 'connected' : 'disconnected',
            response_time_ms: redisHealthy ? Date.now() - start : undefined
          },
          external_apis: externalAPIs
        }
      }
    };

    // Overall health status
    const allHealthy = dbHealthy && redisHealthy && 
      Object.values(externalAPIs).every(api => api.status === 'available');
    
    if (healthResponse.data) {
      healthResponse.data.status = allHealthy ? 'healthy' : 'unhealthy';
    }

    res.status(allHealthy ? 200 : 503).json(healthResponse);
  } catch (error) {
    logger.error('Health check failed:', error);
    
    const errorResponse: ApiResponse<HealthCheckResponse> = {
      success: false,
      error: 'Health check failed',
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        services: {
          database: { status: 'disconnected' },
          redis: { status: 'disconnected' },
          external_apis: {
            openrouter: { status: 'unavailable' },
            google_vision: { status: 'unavailable' },
            weather: { status: 'unavailable' }
          }
        }
      }
    };

    res.status(503).json(errorResponse);
  }
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
  const notFoundResponse: ApiResponse = {
    success: false,
    error: 'ROUTE_NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`
  };
  
  res.status(404).json(notFoundResponse);
});

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  
  try {
    await redisClient.disconnect();
    logger.info('Redis connection closed');
  } catch (error) {
    logger.error('Error closing Redis connection:', error);
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  
  try {
    await redisClient.disconnect();
    logger.info('Redis connection closed');
  } catch (error) {
    logger.error('Error closing Redis connection:', error);
  }
  
  process.exit(0);
});

// Start server
app.listen(PORT, async () => {
  logger.info(`LifeLens backend starting on port ${PORT}`);
  
  // Initialize Redis connection
  try {
    await redisClient.connect();
    logger.info('Redis connected successfully');
  } catch (error) {
    logger.warn('Redis connection failed, continuing without cache:', error);
  }
  
  logger.info(`LifeLens backend ready on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Helper functions for health checks
async function checkDatabaseHealth(): Promise<boolean> {
  try {
    // Import supabase client and test connection
    const { supabase } = await import('./config/supabase');
    const { error } = await supabase.from('user_profiles').select('id').limit(1);
    return !error;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
}

async function checkExternalAPIs() {
  const apiChecks = await Promise.allSettled([
    checkOpenRouterAPI(),
    checkGoogleVisionAPI(),
    checkWeatherAPI()
  ]);

  return {
    openrouter: apiChecks[0].status === 'fulfilled' ? apiChecks[0].value : { status: 'unavailable' as const },
    google_vision: apiChecks[1].status === 'fulfilled' ? apiChecks[1].value : { status: 'unavailable' as const },
    weather: apiChecks[2].status === 'fulfilled' ? apiChecks[2].value : { status: 'unavailable' as const }
  };
}

async function checkOpenRouterAPI() {
  if (!process.env.OPENROUTER_API_KEY) {
    return { status: 'unavailable' as const };
  }

  const start = Date.now();
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
      }
    });
    
    return {
      status: response.ok ? 'available' as const : 'unavailable' as const,
      response_time_ms: Date.now() - start
    };
  } catch (error) {
    return { status: 'unavailable' as const };
  }
}

async function checkGoogleVisionAPI() {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return { status: 'unavailable' as const };
  }

  const start = Date.now();
  try {
    // Simple check - if credentials exist, assume available
    // In production, you might want to make an actual API call
    return {
      status: 'available' as const,
      response_time_ms: Date.now() - start
    };
  } catch (error) {
    return { status: 'unavailable' as const };
  }
}

async function checkWeatherAPI() {
  if (!process.env.OPENWEATHER_API_KEY) {
    return { status: 'unavailable' as const };
  }

  const start = Date.now();
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=London&appid=${process.env.OPENWEATHER_API_KEY}`
    );
    
    return {
      status: response.ok ? 'available' as const : 'unavailable' as const,
      response_time_ms: Date.now() - start
    };
  } catch (error) {
    return { status: 'unavailable' as const };
  }
}

export default app;