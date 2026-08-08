export function requireAdmin(req, res, next) {
  if (!req.session?.adminAuthenticated) {
    return res.status(401).json({
      authenticated: false,
      error: "Authentication required",
    });
  }

  next();
}
