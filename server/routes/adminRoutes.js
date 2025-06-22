import express from 'express';
import {
  getAllUsers,
  updateUserRole,
  getDashboardStats,
  getAdminActivities,
  deleteUser,
  getSubscriptionSummary,
  updateUserSubscription
} from '../controllers/adminController.js';
import { authenticate, authorizeAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication and admin authorization to all routes
// router.use(authenticate, authorizeAdmin);

// User management endpoints
router.get('/users', getAllUsers);
router.put('/users/:userId/role', updateUserRole);
router.get('/activities', getAdminActivities);
router.get('/subscriptions/summary', getSubscriptionSummary);
router.put('/subscriptions/:userId', updateUserSubscription);
// Add this route for user deletion
router.delete('/users/:userId', deleteUser);
// Statistics endpoint
router.get('/stats', getDashboardStats);

export default router;