import bcrypt from "bcrypt";
import { ENV } from "../config/env.js";

export async function loginController(req, res) {
  const { identifier, password } = req.body ?? {};

  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      error: "Identifier and password are required",
    });
  }

  const normalizedIdentifier =
    String(identifier).trim().toLowerCase();

  const usernameMatches =
    normalizedIdentifier === ENV.admin.username.toLowerCase();

  const emailMatches =
    normalizedIdentifier === ENV.admin.email.toLowerCase();

  if (!usernameMatches && !emailMatches) {
    return res.status(401).json({
      success: false,
      error: "Invalid credentials",
    });
  }

  const validPassword = await bcrypt.compare(
    password,
    ENV.admin.passwordHash
  );

  if (!validPassword) {
    return res.status(401).json({
      success: false,
      error: "Invalid credentials",
    });
  }

  req.session.adminAuthenticated = true;
  req.session.adminIdentifier = normalizedIdentifier;

  return res.json({
    success: true,
    user: {
      username: ENV.admin.username,
      email: ENV.admin.email,
    },
  });
}

export function logoutController(req, res) {
  req.session.destroy(() => {
    res.clearCookie("ikevvy_admin_session");

    res.json({
      success: true,
    });
  });
}

export function sessionController(req, res) {
  if (!req.session?.adminAuthenticated) {
    return res.status(401).json({
      authenticated: false,
    });
  }

  res.json({
    authenticated: true,
    user: {
      username: ENV.admin.username,
      email: ENV.admin.email,
    },
  });
}
