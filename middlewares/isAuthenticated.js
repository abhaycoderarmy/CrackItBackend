// import jwt from "jsonwebtoken";
// import { User } from "../models/user.model.js"; // Import User model

// const isAuthenticated = async (req, res, next) => {
//     try {
//         // Check for token in cookies first, then in Authorization header
//         let token = req.cookies.token;
        
//         if (!token) {
//             const authHeader = req.headers.authorization;
//             if (authHeader && authHeader.startsWith('Bearer ')) {
//                 token = authHeader.substring(7); // Remove 'Bearer ' prefix
//             }
//         }

//         // Debug logging
//         console.log('Token received:', token);
//         console.log('Token type:', typeof token);
//         console.log('Token length:', token ? token.length : 'null');

//         // Check for invalid tokens - including string "undefined" and "null"
//         if (!token || 
//             token === 'undefined' || 
//             token === 'null' || 
//             token === 'Bearer undefined' ||
//             token.length < 50 || // JWT tokens are typically much longer
//             !token.includes('.')) { // JWT tokens must contain dots
            
//             console.log('Invalid token detected:', token);
//             return res.status(401).json({
//                 message: "User not authenticated - invalid token",
//                 success: false,
//             });
//         }

//         const decode = await jwt.verify(token, process.env.SECRET_KEY);
//         if (!decode) {
//             return res.status(401).json({
//                 message: "Invalid token",
//                 success: false
//             });
//         }

//         // Fetch user details and attach to req.user (needed for role checking)
//         const user = await User.findById(decode.userId).select('-password');
//         if (!user) {
//             return res.status(401).json({
//                 message: "User not found",
//                 success: false
//             });
//         }

//         req.user = user; // Attach full user object
//         req.id = decode.userId; // Keep this for backward compatibility
//         next();
//     } catch (error) {
//         console.log(error);
//         return res.status(401).json({
//             message: "Invalid token",
//             success: false
//         });
//     }
// }

// export default isAuthenticated;

// middlewares/isAuthenticated.js
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const isAuthenticated = async (req, res, next) => {
  try {
    // 1. Try to get token from cookies
    let token = req.cookies?.token;

    // 2. If no token in cookies, check Authorization header "Bearer <token>"
    if (!token) {
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7); // Remove "Bearer " prefix
      }
    }

    // Debug logs: You can remove later or comment out
    console.log("Token received in isAuthenticated:", token);

    // 3. Basic validation of token presence and structure
    if (
      !token ||
      token === "undefined" ||
      token === "null" ||
      token.length < 20 || // JWT tokens are typically much longer than 20 chars
      !token.includes(".")
    ) {
      console.log("Invalid or missing token:", token);
      return res.status(401).json({
        message: "User not authenticated - invalid token",
        success: false,
      });
    }

    // 4. Verify JWT token with SECRET_KEY
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

// Use any of the possible keys your tokens have (example)
const userId = decoded.userId || decoded.id || decoded.userID;

if (!userId) {
  return res.status(401).json({ message: "Invalid token - user id missing", success: false });
}

const user = await User.findById(userId).select("-password");


    // 5. Fetch user from DB by userId in token payload
    if (!user) {
      return res.status(401).json({
        message: "User not found",
        success: false,
      });
    }

    // 6. Attach user info to request object for downstream usage
    req.user = user;
    req.id = decoded.userId;

    next();
  } catch (error) {
    console.error("Authentication middleware error:", error.message);
    return res.status(401).json({
      message: "Authentication failed",
      success: false,
    });
  }
};

export default isAuthenticated;
export { isAuthenticated };