import jwt from 'jsonwebtoken';
import Company from '../models/Company.js';

export const protectCompany = async (req, res, next) => {
    const token = req.headers.token;
    console.log('token:', token);
    console.log('JWT_SECRET:', process.env.JWT_SECRET);

    if (!token) {
        return res.json({ success: false, message: 'Not authorized, Login Again' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('decoded:', decoded);
       console.log("Recherche de l'entreprise en base...");
req.company = await Company.findById(decoded.id).select('-password');
console.log("Entreprise trouvée :", req.company);
        next();
    } catch (error) {
        console.log('JWT verify error:', error.message);
        return res.json({ success: false, message: error.message });
    }
};
