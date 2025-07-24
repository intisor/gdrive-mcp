import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Simple in-memory user store (in production, use a database)
const users = new Map();

// Configure Google OAuth strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_REDIRECT_URI
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const user = {
      id: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      picture: profile.photos[0].value,
      accessToken,
      refreshToken,
      createdAt: new Date()
    };
    
    // Store user (in production, save to database)
    users.set(profile.id, user);
    
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const user = users.get(id);
  done(null, user);
});

// Middleware to verify JWT token
export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = users.get(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Generate JWT token
export const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

// Get user by ID
export const getUserById = (id) => {
  return users.get(id);
};

// Get all users (for admin purposes)
export const getAllUsers = () => {
  return Array.from(users.values());
};

export default passport;
