import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // Add request ID for tracking
  const requestId = uuidv4();
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);

  const startTime = Date.now();
  
  // Log request
  console.log(`📥 ${req.method} ${req.path}`, {
    requestId,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusColor = res.statusCode >= 400 ? '🔴' : '🟢';
    
    console.log(`📤 ${statusColor} ${res.statusCode} ${req.method} ${req.path}`, {
      requestId,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  });

  next();
};