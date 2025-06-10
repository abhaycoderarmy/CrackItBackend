
// controllers/adminController.js
import { User } from '../models/user.model.js';
import { Company } from '../models/company.model.js';
import { Job } from '../models/job.model.js';
import Newsletter from '../models/newsletter.model.js';
import nodemailer from 'nodemailer';



// GET all users (admin)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().populate('profile.company');
    return res.status(200).json({ success: true, users });
  } catch (error) {
    console.error("Admin getAllUsers error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch users." });
  }
};

export const toggleUserVisibility = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    // Toggle status
    user.status = user.status === "active" ? "blocked" : "active";
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User status updated to ${user.status}.`,
      user
    });
  } catch (error) {
    console.error("toggleUserVisibility error:", error);
    return res.status(500).json({ success: false, message: "Failed to update user status." });
  }
};



export const getAllCompanies = async (req, res) => {
  try {
    console.log("Fetching companies...");
    console.log("User making request:", req.user);
    
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin role required.' 
      });
    }
    
    const companies = await Company.find({});
    console.log(`Found ${companies.length} companies`);
    
    res.status(200).json({ success: true, companies });
  } catch (err) {
    console.error("Error fetching companies:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllJobs = async (req, res) => {
  try {
    console.log("Fetching jobs...");
    console.log("User making request:", req.user);
    
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin role required.' 
      });
    }
    
    const jobs = await Job.find({}).populate('company', 'name');
    console.log(`Found ${jobs.length} jobs`);
    
    res.status(200).json({ success: true, jobs });
  } catch (err) {
    console.error("Error fetching jobs:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    console.log("Updating user status...");
    console.log("User making request:", req.user);
    console.log("Request params:", req.params);
    console.log("Request body:", req.body);
    
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin role required.' 
      });
    }
    
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true, select: '-password' }
    );
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    console.log("User status updated:", user);
    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error("Error updating user status:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllNewsletters = async (req, res) => {
  try {
    console.log("Fetching newsletters...");
    console.log("User making request:", req.user);
    
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin role required.' 
      });
    }
    
    const newsletters = await Newsletter.find({});
    console.log(`Found ${newsletters.length} newsletters`);
    
    res.status(200).json({ success: true, newsletters });
  } catch (err) {
    console.error("Error fetching newsletters:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const toggleNewsletterStatus = async (req, res) => {
  try {
    console.log("Toggling newsletter status...");
    console.log("User making request:", req.user);
    console.log("Request params:", req.params);
    console.log("Request body:", req.body);
    
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin role required.' 
      });
    }
    
    const { status } = req.body;
    const newsletter = await Newsletter.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    );
    
    if (!newsletter) {
      return res.status(404).json({ 
        success: false, 
        message: 'Newsletter not found' 
      });
    }
    
    console.log("Newsletter status updated:", newsletter);
    res.status(200).json({ success: true, newsletter });
  } catch (err) {
    console.error("Error toggling newsletter status:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const sendEmail = async (req, res) => {
  try {
    console.log("Sending email...");
    console.log("User making request:", req.user);
    console.log("Request body:", req.body);
    
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin role required.' 
      });
    }
    
    const { to, content } = req.body;
    if (!to || !content) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing email or content." 
      });
    }

    // Check if email environment variables are set
    if (!process.env.SMTP_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ 
        success: false, 
        message: "Email configuration not set up properly." 
      });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject: 'Message from Admin',
      text: content
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to:", to);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully.' 
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({ 
      success: false, 
      message: 'Email failed.', 
      error: error.message 
    });
  }
};

export const getAdminJobManagement = async (req, res) => {
    try {
        console.log("Fetching admin job management data...");
        
        // Make sure to populate applications with user/applicant data
        const jobs = await Job.find()
            .populate({
                path: 'company',
                select: 'name'
            })
            .populate({
                path: 'applications',
                populate: {
                    path: 'applicant', // or 'user' depending on your schema
                    select: 'fullname name email phoneNumber profile role createdAt updatedAt',
                    populate: {
                        path: 'profile',
                        select: 'bio skills resume resumeOriginalName profilePhoto company'
                    }
                }
            })
            .sort({ createdAt: -1 });

        console.log("Jobs fetched:", jobs.length);
        
        return res.status(200).json({
            success: true,
            jobs
        });
    } catch (error) {
        console.error("Error in getAdminJobManagement:", error);
        return res.status(500).json({
            success: false,
            message: "Server error: " + error.message
        });
    }
};


export const getAdminOwnJobs = async (req, res) => {
  try {
    const adminId = req.id;
    console.log("Fetching jobs created by admin:", adminId);
    
    const jobs = await Job.find({ created_by: adminId })
      .populate('company', 'name')
      .populate({
        path: 'applications',
        populate: { 
          path: 'applicant',
          select: 'fullname email profile.resume'
        }
      })
      .sort({ createdAt: -1 });

    if (!jobs || jobs.length === 0) {
      return res.status(200).json({
        message: "No jobs found.",
        success: true,
        jobs: []
      });
    }

    return res.status(200).json({
      jobs,
      success: true,
      message: "Admin jobs fetched successfully"
    });
  } catch (error) {
    console.error("Error fetching admin jobs:", error);
    return res.status(500).json({
      message: "Server error while fetching jobs.",
      success: false,
      error: error.message
    });
  }
}