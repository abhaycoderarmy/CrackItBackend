import express from "express";
import {
  login,
  logout,
  register,
  updateProfile,
  getAllUsers,
  sendOtp,
  verifyOtp,
  resetPassword,
  getAllUsersForAdmin,
  getUserProfile
} from "../controllers/user.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { isAdmin } from "../middlewares/isAdmin.js"; // <-- admin middleware
import { singleUpload } from "../middlewares/mutler.js";

const router = express.Router();
// 

// Route to get user profile by ID (admin only)
router.route('/users/:id').get(isAuthenticated, isAdmin, getUserProfile);

// Route to get all users (admin only)
router.route('/users').get(isAuthenticated, isAdmin, getAllUsersForAdmin);


router.route("/register").post(singleUpload, register);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/profile/update").post(isAuthenticated, singleUpload, updateProfile);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);


// ✅ Admin-only route to get all users
router.route("/all-users").get(isAuthenticated, isAdmin, getAllUsers);

export default router;
