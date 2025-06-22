import jwt from 'jsonwebtoken';
import Company from '../models/Company.js';
import User from '../models/User.js';
import { ROLES } from '../utils/constant.js';

// Middleware pour protéger l'utilisateur
export const protectUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Vérifie et décode le token JWT avec la clé secrète
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ajoute l'ID utilisateur décodé dans req.auth pour les routes suivantes
    req.auth = { userId: decoded.id };

    // Optionnel : vérifier que l'utilisateur existe en base
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Middleware pour protéger l'entreprise (company)
export const protectCompany = async (req, res, next) => {
  const token = req.headers.token;

  if (!token) {
    return res.json({ success: false, message: 'Not authorized, Login Again' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.company = await Company.findById(decoded.id).select('-password');

    if (!req.company) {
      return res.status(401).json({ success: false, message: 'Company not found' });
    }

    next();
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};


export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      error: 'Authorization token required' 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findOne({ _id: decoded.id });
    
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      error: 'Invalid or expired token' 
    });
  }
};

export const authorizeAdmin = (req, res, next) => {
  if (req.user?.role !== ROLES.ADMIN) {
    return res.status(403).json({ 
      success: false, 
      error: 'Admin privileges required' 
    });
  }
  next();
};