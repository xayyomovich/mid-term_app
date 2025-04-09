import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';


dotenv.config();


const JWT_SECRET = process.env.JWT_SECRET || 'midterm';
const JWT_EXPIRATION = '24h';

export const hashPassword = (password) => {
  const saltRounds = 10;
  return bcrypt.hashSync(password, saltRounds);
};

export const verifyPassword = (password, hash) => {
  return bcrypt.compareSync(password, hash);
};

export const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    console.warn('WARNING: Using fallback JWT secret. Set JWT_SECRET in .env file for production.');
  }
  
  const payload = {
    id: user.id,
    email: user.email,
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Token verification error:', error.message);
    return null;
  }
};

export const authenticate = (context) => {
  const token = context?.token?.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('Authentication required. No token provided.');
  }
  
  const decodedToken = verifyToken(token);
  if (!decodedToken) {
    throw new Error('Invalid or expired token.');
  }

  context.user = decodedToken;
  return context;
};