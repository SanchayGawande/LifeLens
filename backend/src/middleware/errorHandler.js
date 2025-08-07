const winston = require('winston');

const logger = winston.createLogger({
  level: 'error',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log' })
  ]
});

const errorHandler = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const statusCode = err.statusCode || 500;
  const message = isDevelopment ? err.message : 'Internal server error';
  
  res.status(statusCode).json({
    error: message,
    ...(isDevelopment && { stack: err.stack })
  });
};

module.exports = errorHandler;