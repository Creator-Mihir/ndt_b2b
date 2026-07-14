import jwt from 'jsonwebtoken';

export const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET is missing in production environment variables.');
    }
    console.warn('WARNING: JWT_SECRET environment variable is missing. Falling back to default weak key.');
  }

  return jwt.sign(
    { id: userId },
    secret || 'supersecretjwtkeychangeinproduction',
    {
      expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
    }
  );
};
