import { Job } from "../models/job.model.js";

// admin post krega job
export const postJob = async (req, res) => {
    try {
        const { title, description, requirements, salary, location, jobType, experience, position, companyId } = req.body;
        const userId = req.id;

        if (!title || !description || !requirements || !salary || !location || !jobType || !experience || !position || !companyId) {
            return res.status(400).json({
                message: "Somethin is missing.",
                success: false
            })
        };
        const job = await Job.create({
            title,
            description,
            requirements: requirements.split(","),
            salary: Number(salary),
            location,
            jobType,
            experienceLevel: experience,
            position,
            company: companyId,
            created_by: userId
        });
        return res.status(201).json({
            message: "New job created successfully.",
            job,
            success: true
        });
    } catch (error) {
        console.log(error);
    }
}
// student k liye
export const getAllJobs = async (req, res) => {
    try {
        const keyword = req.query.keyword || "";
        const query = {
            $or: [
                { title: { $regex: keyword, $options: "i" } },
                { description: { $regex: keyword, $options: "i" } },
            ]
        };
        const jobs = await Job.find(query).populate({
            path: "company"
        }).sort({ createdAt: -1 });
        if (!jobs) {
            return res.status(404).json({
                message: "Jobs not found.",
                success: false
            })
        };
        return res.status(200).json({
            jobs,
            success: true
        })
    } catch (error) {
        console.log(error);
    }
}
// student
export const getJobById = async (req, res) => {
    try {
        const jobId = req.params.id;
        const job = await Job.findById(jobId).populate({
            path:"applications"
        });
        if (!job) {
            return res.status(404).json({
                message: "Jobs not found.",
                success: false
            })
        };
        return res.status(200).json({ job, success: true });
    } catch (error) {
        console.log(error);
    }
}
// admin kitne job create kra hai abhi tk
export const getAdminJobs = async (req, res) => {
    try {
        const adminId = req.id;
        const jobs = await Job.find({ created_by: adminId }).populate({
            path:'company',
            createdAt:-1
        });
        if (!jobs) {
            return res.status(404).json({
                message: "Jobs not found.",
                success: false
            })
        };
        return res.status(200).json({
            jobs,
            success: true
        })
    } catch (error) {
        console.log(error);
    }
}

// export const updateJob = async (req, res) => {
//   try {
//     const jobId = req.params.id;
//     const userId = req.id;
//     const {
//       title,
//       description,
//       requirements,
//       salary,
//       location,
//       jobType,
//       experience,
//       position,
//       companyId,
//     } = req.body;

//     if (!title || !description || !requirements || !salary || !location || !jobType || !experience || !position || !companyId) {
//       return res.status(400).json({
//         message: "Some fields are missing.",
//         success: false,
//       });
//     }

//     const job = await Job.findOne({ _id: jobId, created_by: userId });

//     if (!job) {
//       return res.status(404).json({
//         message: "Job not found or you are not authorized to update it.",
//         success: false,
//       });
//     }

//     job.title = title;
//     job.description = description;
//     job.requirements = typeof requirements === "string" ? requirements.split(",") : requirements;
//     job.salary = Number(salary);
//     job.experienceLevel = experience;
//     job.location = location;
//     job.jobType = jobType;
//     job.position = Number(position);
//     job.company = companyId;

//     await job.save();

//     return res.status(200).json({
//       message: "Job updated successfully.",
//       job,
//       success: true,
//     });
//   } catch (error) {
//     console.error("Update job error:", error);
//     return res.status(500).json({
//       message: "Server error.",
//       success: false,
//     });
//   }
// };
// Delete job by admin

export const updateJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.id;
    const userRole = req.user?.role; // Make sure you're getting user role from middleware
    
    const {
      title,
      description,
      requirements,
      salary,
      location,
      jobType,
      experience,
      position,
      companyId,
    } = req.body;

    if (!title || !description || !requirements || !salary || !location || !jobType || !experience || !position || !companyId) {
      return res.status(400).json({
        message: "Some fields are missing.",
        success: false,
      });
    }

    // FIXED: Check if user is admin OR job creator
    let job;
    if (userRole === 'admin') {
      // Admin can update any job
      job = await Job.findById(jobId);
    } else {
      // Non-admin can only update their own jobs
      job = await Job.findOne({ _id: jobId, created_by: userId });
    }

    if (!job) {
      return res.status(404).json({
        message: "Job not found or you are not authorized to update it.",
        success: false,
      });
    }

    job.title = title;
    job.description = description;
    job.requirements = typeof requirements === "string" ? requirements.split(",") : requirements;
    job.salary = Number(salary);
    job.experienceLevel = experience;
    job.location = location;
    job.jobType = jobType;
    job.position = Number(position);
    job.company = companyId;

    await job.save();

    return res.status(200).json({
      message: "Job updated successfully.",
      job,
      success: true,
    });
  } catch (error) {
    console.error("Update job error:", error);
    return res.status(500).json({
      message: "Server error.",
      success: false,
    });
  }
};
// export const deleteJob = async (req, res) => {
//   try {
//     const jobId = req.params.id;
//     const userId = req.id;

//     const job = await Job.findOne({ _id: jobId, created_by: userId });

//     if (!job) {
//       return res.status(404).json({
//         message: "Job not found or you are not authorized to delete it.",
//         success: false,
//       });
//     }

//     await job.deleteOne();

//     return res.status(200).json({
//       message: "Job deleted successfully.",
//       success: true,
//     });
//   } catch (error) {
//     console.error("Delete job error:", error);
//     return res.status(500).json({
//       message: "Server error.",
//       success: false,
//     });
//   }
// };
export const deleteJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.id;
    const userRole = req.user?.role; // Make sure you're getting user role from middleware

    // FIXED: Check if user is admin OR job creator
    let job;
    if (userRole === 'admin') {
      // Admin can delete any job
      job = await Job.findById(jobId);
    } else {
      // Non-admin can only delete their own jobs
      job = await Job.findOne({ _id: jobId, created_by: userId });
    }

    if (!job) {
      return res.status(404).json({
        message: "Job not found or you are not authorized to delete it.",
        success: false,
      });
    }

    await job.deleteOne();

    return res.status(200).json({
      message: "Job deleted successfully.",
      success: true,
    });
  } catch (error) {
    console.error("Delete job error:", error);
    return res.status(500).json({
      message: "Server error.",
      success: false,
    });
  }
};

