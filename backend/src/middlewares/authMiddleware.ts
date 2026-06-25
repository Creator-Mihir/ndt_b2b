import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/user';

// Extend the Express Request interface globally
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export interface DecodedToken {
  id: string;
  iat: number;
  exp: number;
}

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    // Check for authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
       res.status(401).json({
        status: 'error',
        message: 'You are not logged in. Please log in to get access.'
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'supersecretjwtkeychangeinproduction'
    ) as DecodedToken;

    // Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
       res.status(401).json({
        status: 'error',
        message: 'The user belonging to this token no longer exists.'
      });
      return;
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
     res.status(401).json({
      status: 'error',
      message: 'Invalid token. Please log in again.'
    });
  }
};

export const restrictTo = (...roles: ('customer' | 'admin')[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
       res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action.'
      });
       return;
    }
    next();
  };
};

export const optionalProtect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'supersecretjwtkeychangeinproduction'
      ) as DecodedToken;

      const currentUser = await User.findById(decoded.id);
      if (currentUser) {
        req.user = currentUser;
      }
    }
  } catch (error) {
    // Fail silently since it is optional protection
  }
  next();
};
