export const checkAuth = async (req, res) => {
  try {
    console.log('Auth check request:', req.user);
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Return user info without password
    const userInfo = {
      _id: req.user._id,
      fullname: req.user.fullname,
      email: req.user.email,
      role: req.user.role,
      status: req.user.status
    };

    res.status(200).json({
      success: true,
      user: userInfo
    });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during auth check'
    });
  }
};