
import express from 'express';
import {
  getAllUsers,
  toggleUserVisibility,
  updateUserStatus,
  getAllNewsletters,
  toggleNewsletterStatus,
  sendEmail,
  getAllCompanies,
  getAdminJobManagement ,
  getAllJobs, 
  getAdminOwnJobs// Make sure this is imported
} from '../controllers/adminController.js';
import isAuthenticated from '../middlewares/isAuthenticated.js';

const router = express.Router();

// Debug middleware for all admin routes
router.use((req, res, next) => {
  console.log(`Admin route accessed: ${req.method} ${req.path}`);
  console.log('User ID:', req.id);
  next();
});

// Apply authentication middleware to all routes in this router
router.use(isAuthenticated);

// Admin role check middleware
const isAdmin = (req, res, next) => {
  console.log('Checking admin permissions for user:', req.user);

  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  
  next();
};

// Apply admin middleware to all admin routes
router.use(isAdmin);

// User management routes
router.get('/users', getAllUsers);
router.patch('/users/:userId/visibility', toggleUserVisibility);
router.put('/users/:id/status', updateUserStatus);

// Newsletter management routes
router.get('/newsletters', getAllNewsletters);
router.put('/newsletters/:id/status', toggleNewsletterStatus);

// Company and job management routes
router.get('/companies', getAllCompanies);

// Job management route - this should match your React component request
router.get('/job-management', getAdminJobManagement);

// Email route
router.post('/send-email', sendEmail);
router.get('/own-jobs', isAdmin, getAdminOwnJobs);
router.get('/jobs',  isAdmin, getAllJobs);

export default router;