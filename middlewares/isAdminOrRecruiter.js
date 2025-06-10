export const isAdminOrRecruiter = (req, res, next) => {
  const role = req.user?.role;
  if (role === "admin" || role === "recruiter") {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Only admin or recruiter can access this resource",
  });
};
