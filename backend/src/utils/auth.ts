import jwt from 'jsonwebtoken';

export const generateToken = (userId: string): string => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'supersecretjwtkeychangeinproduction',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};
