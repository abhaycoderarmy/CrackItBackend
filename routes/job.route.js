import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { getAdminJobs, getAllJobs, getJobById, postJob } from "../controllers/job.controller.js";
import { updateJob } from "../controllers/job.controller.js";
import { deleteJob } from "../controllers/job.controller.js";
const router = express.Router();

router.route("/post").post(isAuthenticated, postJob);
router.route("/get").get( getAllJobs);
router.route("/getadminjobs").get(isAuthenticated, getAdminJobs);
router.route("/get/:id").get(isAuthenticated, getJobById);
router.route("/update/:id").put(isAuthenticated, updateJob);
router.route("/:id").delete(isAuthenticated, deleteJob);
// router.delete('/jobs/:id', isAuthenticated, deleteJob);
export default router;

