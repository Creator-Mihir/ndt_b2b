import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Import Routers
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import quoteRoutes from './routes/quoteRoutes';
import { AppError } from './utils/AppError';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/conex';

// Middlewares
app.use(helmet());
app.use(cors({
  origin: '*', // Allow all origins for development, adjust for production
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'CONEX.in API is running smoothly',
    timestamp: new Date().toISOString(),
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/quotes', quoteRoutes);

// Fallback for Page/Route Not Found
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new AppError('Endpoint not found', 404));
});

// Global Error Handler Middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  let error = { ...err };
  error.message = err.message;

  // Log error during development
  console.error('API Error details:', err);

  // Mongoose CastError (invalid ObjectId format)
  if (err.name === 'CastError') {
    error = new AppError(`Resource not found with id of ${err.value}`, 404);
  }

  // Mongoose Duplicate Key (Code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = new AppError(`Duplicate field value entered: ${field}. Please use another value.`, 400);
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val: any) => val.message);
    error = new AppError(`Validation failed: ${messages.join('. ')}`, 400);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid authentication token. Please log in again.', 401);
  }
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Your session has expired. Please log in again.', 401);
  }

  const statusCode = error.statusCode || 500;
  const status = error.status || 'error';

  res.status(statusCode).json({
    status,
    message: error.message || 'Internal Server Error'
  });
});

// Database Connection & Server Start
const startServer = async () => {
  try {
    // Attempt Mongoose connection (disable strictQuery deprecation warning)
    mongoose.set('strictQuery', false);
    await mongoose.connect(MONGODB_URI);
    console.log('Successfully connected to MongoDB.');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    console.log('Continuing server startup without active MongoDB connection (DB-reliant services may fail).');
  }

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  });
};

startServer();
