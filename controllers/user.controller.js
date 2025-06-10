import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export const register = async (req, res) => {
    try {
        const { fullname, email, phoneNumber, password, role } = req.body;
         
        if (!fullname || !email || !phoneNumber || !password || !role) {
            return res.status(400).json({
                message: "Something is missing",
                success: false
            });
        };
        const file = req.file;
        const fileUri = getDataUri(file);
        const cloudResponse = await cloudinary.uploader.upload(fileUri.content);

        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({
                message: 'User already exist with this email.',
                success: false,
            })
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            fullname,
            email,
            phoneNumber,
            password: hashedPassword,
            role,
            profile:{
                profilePhoto:cloudResponse.secure_url,
            }
        });

        return res.status(201).json({
            message: "Account created successfully.",
            success: true
        });
    } catch (error) {
        console.log(error);
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required.",
                success: false
            });
        }

        // Find user by email
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                message: "Incorrect email or password.",
                success: false,
            });
        }

        // Compare password
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({
                message: "Incorrect email or password.",
                success: false,
            });
        }

        // Prepare token data
        const tokenData = {
            userId: user._id
        };
        const token = jwt.sign(tokenData, process.env.SECRET_KEY, { expiresIn: '1d' });

        // Strip out password before sending response AND INCLUDE TOKEN
        const sanitizedUser = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile,
            token: token  // <-- CRITICAL: Add token to user object
        };

        // Send token as cookie AND in response body
        return res
            .status(200)
            .cookie("token", token, {
                maxAge: 1 * 24 * 60 * 60 * 1000,
                httpOnly: true,
                sameSite: 'strict',
            })
            .json({
                message: `Welcome back ${user.fullname}`,
                user: sanitizedUser,  // Now includes token
                success: true
            });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
};

export const logout = async (req, res) => {
    try {
        return res.status(200).cookie("token", "", { maxAge: 0 }).json({
            message: "Logged out successfully.",
            success: true
        })
    } catch (error) {
        console.log(error);
    }
}

export const updateProfile = async (req, res) => {
    try {
        const { fullname, email, phoneNumber, bio, skills } = req.body;
        
        const file = req.file;
        let cloudResponse = null;
        
        // Handle file upload only if file exists
        if (file) {
            const fileUri = getDataUri(file);
            cloudResponse = await cloudinary.uploader.upload(fileUri.content);
        }

        // Handle skills array conversion only if skills exist
        let skillsArray;
        if (skills && skills.trim()) {
            skillsArray = skills.split(",").map(skill => skill.trim()).filter(skill => skill);
        }

        const userId = req.id; // middleware authentication
        let user = await User.findById(userId);

        if (!user) {
            return res.status(400).json({
                message: "User not found.",
                success: false
            })
        }

        // Initialize profile object if it doesn't exist
        if (!user.profile) {
            user.profile = {};
        }

        // Update only provided fields (partial update)
        if (fullname !== undefined && fullname.trim()) {
            user.fullname = fullname.trim();
        }
        
        if (email !== undefined && email.trim()) {
            // Check if email is already taken by another user
            const existingUser = await User.findOne({ 
                email: email.trim(), 
                _id: { $ne: userId } 
            });
            if (existingUser) {
                return res.status(400).json({
                    message: "Email is already taken by another user.",
                    success: false
                });
            }
            user.email = email.trim();
        }
        
        if (phoneNumber !== undefined && phoneNumber.trim()) {
            user.phoneNumber = phoneNumber.trim();
        }
        
        if (bio !== undefined) {
            user.profile.bio = bio.trim();
        }
        
        if (skillsArray !== undefined) {
            user.profile.skills = skillsArray;
        }

        // Handle resume/file upload
        if (cloudResponse) {
            user.profile.resume = cloudResponse.secure_url;
            user.profile.resumeOriginalName = file.originalname;
        }

        // Handle profile photo upload (if sent separately from resume)
        // Note: If using single file upload, profile photo would be handled differently
        // This depends on your multer configuration

        await user.save();

        // Return sanitized user data
        const updatedUser = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile
        };

        return res.status(200).json({
            message: "Profile updated successfully.",
            user: updatedUser,
            success: true
        });
        
    } catch (error) {
        console.error("Profile update error:", error);
        return res.status(500).json({
            message: "Server error occurred while updating profile.",
            success: false
        });
    }
}

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({});
        return res.status(200).json({ success: true, users });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to fetch users." });
    }
};

// Send OTP
// import nodemailer from "nodemailer";
// import { User } from "../models/user.model.js";

export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in DB (better: use a separate OTP model, for now add to user schema)
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpiry = Date.now() + 10 * 60 * 1000; // 10 mins expiry
    await user.save();

    // Send email using transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Your OTP for Password Reset",
      html: `<p>Your OTP is: <strong>${otp}</strong></p>`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "OTP sent successfully.",
    });
  } catch (error) {
    console.error("sendOtp error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required.",
      });
    }

    const user = await User.findOne({ email });
    if (!user || !user.resetPasswordOtp) {
      return res.status(400).json({
        success: false,
        message: "OTP not found or expired.",
      });
    }

    // Check OTP and expiry
    const isOtpValid =
      user.resetPasswordOtp === otp &&
      user.resetPasswordOtpExpiry > Date.now();

    if (!isOtpValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP.",
      });
    }

    // Mark OTP as verified or remove it
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpiry = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
    });
  } catch (error) {
    console.error("verifyOtp error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getUserProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        console.log("Fetching user profile for ID:", userId);
        
        // Find user by ID and exclude password, populate profile if needed
        const user = await User.findById(userId)
            .select('-password')
            .populate('profile'); // Add this if profile is a separate model
        
        if (!user) {
            return res.status(404).json({
                message: "User not found.",
                success: false
            });
        }

        console.log("User found:", user);

        return res.status(200).json({
            user,
            success: true
        });
    } catch (error) {
        console.log("Error fetching user profile:", error);
        return res.status(500).json({
            message: "Server error: " + error.message,
            success: false
        });
    }
};
export const getAllUsersForAdmin = async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .populate('profile') // Add this if profile is a separate model
            .sort({ createdAt: -1 });
        
        return res.status(200).json({
            users,
            success: true
        });
    } catch (error) {
        console.log("Error fetching users:", error);
        return res.status(500).json({
            message: "Server error: " + error.message,
            success: false
        });
    }
};