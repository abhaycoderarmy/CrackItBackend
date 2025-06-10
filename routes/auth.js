import { isAuthenticated } from '../middlewares/isAuthenticated.js';

// Add this route to your auth router
router.get('/check', isAuthenticated, checkAuth);