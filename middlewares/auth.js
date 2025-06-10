// backend/middlewares/auth.js
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';


export const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized: No token provided' });

    // console.log("Token received:", token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log("Decoded token:", decoded);

    req.user = await User.findById(decoded.userId).select('-password');
    if (!req.user) return res.status(401).json({ message: 'Unauthorized: User not found' });

    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};


export const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admins only' });
  }
  next();
};
