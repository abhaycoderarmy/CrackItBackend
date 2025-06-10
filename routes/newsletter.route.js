import express from "express";
import {
  createNewsletter,
  getAllNewsletters,
   getPublicNewsletters,
  getNewslettersByAuthor,
  updateNewsletter,
  deleteNewsletter,
  toggleNewsletterPrivacy
} from "../controllers/newsletter.controller.js";

import isAuthenticated from "../middlewares/isAuthenticated.js";
import { isAdminOrRecruiter } from "../middlewares/isAdminOrRecruiter.js";

const router = express.Router();

// Create newsletter - only admin or recruiter can create
router.route("/").post(isAuthenticated, isAdminOrRecruiter, createNewsletter);

// Get all newsletters - public route, but authentication affects what's returned
// Use optional authentication middleware to check if user is logged in
router.route("/").get((req, res, next) => {
  // Optional authentication - don't fail if no token
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  if (token) {
    return isAuthenticated(req, res, next);
  }
  next();
}, getAllNewsletters);

// Get newsletters by author ID - needs authentication for private newsletters
router.route("/by-author").get((req, res, next) => {
  // Optional authentication for by-author route
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  if (token) {
    return isAuthenticated(req, res, next);
  }
  next();
}, getNewslettersByAuthor);

// Public route - no authentication required
router.route("/public").get(getPublicNewsletters);

// Update newsletter - only author can update
router.route("/:id").put(isAuthenticated, updateNewsletter);

// Delete newsletter - only author can delete
router.route("/:id").delete(isAuthenticated, deleteNewsletter);

// Toggle newsletter privacy - only author can toggle
router.route("/:id/privacy").patch(isAuthenticated, toggleNewsletterPrivacy);

export default router;