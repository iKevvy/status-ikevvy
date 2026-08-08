import bcrypt from "bcrypt";

import { ENV } from "../config/env.js";

import {
  generateLoginCode,
  createLoginCode,
  verifyLoginCode,
  generateTrustedToken,
  createTrustedDevice,
  validateTrustedDevice,
  revokeTrustedDevice,
} from "../services/adminSecurityService.js";

import {
  sendAdminLoginCode,
} from "../services/mailService.js";

const TRUST_COOKIE =
  "ikevvy_trusted_device";

const TRUST_MAX_AGE =
  1000 * 60 * 60 * 24 * 30;

function trustedCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict",

    // Change to true once the admin side uses HTTPS.
    secure: false,

    maxAge: TRUST_MAX_AGE,
    path: "/api/v1/admin",
  };
}

function maskedAdminEmail() {
  const email = ENV.admin.email;

  const [local, domain] =
    email.split("@");

  const visible =
    local.slice(0, 2);

  return `${visible}${"*".repeat(
    Math.max(local.length - 2, 3)
  )}@${domain}`;
}

async function finishLogin(
  req,
  res,
  rememberDevice
) {
  req.session.regenerate(
    async (error) => {
      if (error) {
        return res.status(500).json({
          success: false,
          error:
            "Unable to create admin session",
        });
      }

      req.session.adminAuthenticated =
        true;

      req.session.adminIdentifier =
        ENV.admin.email;

      if (rememberDevice) {
        const token =
          generateTrustedToken();

        await createTrustedDevice(
          token,
          req.get("user-agent")
        );

        res.cookie(
          TRUST_COOKIE,
          token,
          trustedCookieOptions()
        );
      }

      return res.json({
        success: true,
        authenticated: true,

        user: {
          username:
            ENV.admin.username,

          email:
            ENV.admin.email,
        },
      });
    }
  );
}

export async function loginController(
  req,
  res
) {
  const {
    identifier,
    password,
  } = req.body ?? {};

  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      error:
        "Identifier and password are required",
    });
  }

  const normalized =
    String(identifier)
      .trim()
      .toLowerCase();

  const usernameMatches =
    normalized ===
    ENV.admin.username.toLowerCase();

  const emailMatches =
    normalized ===
    ENV.admin.email.toLowerCase();

  if (
    !usernameMatches &&
    !emailMatches
  ) {
    return res.status(401).json({
      success: false,
      error: "Invalid credentials",
    });
  }

  const validPassword =
    await bcrypt.compare(
      password,
      ENV.admin.passwordHash
    );

  if (!validPassword) {
    return res.status(401).json({
      success: false,
      error: "Invalid credentials",
    });
  }

  const code =
    generateLoginCode();

  await createLoginCode(code);

  try {
    await sendAdminLoginCode(code);
  } catch (error) {
    console.error(
      "Unable to send admin login code:",
      error.message
    );

    return res.status(503).json({
      success: false,
      error:
        "Unable to send verification code",
    });
  }

  req.session.passwordVerified =
    true;

  req.session.adminIdentifier =
    normalized;

  req.session.otpSentAt =
    Date.now();

  return res.json({
    success: true,
    requiresEmailCode: true,
    destination:
      maskedAdminEmail(),
  });
}

export async function verifyEmailCodeController(
  req,
  res
) {
  const {
    code,
    rememberDevice = false,
  } = req.body ?? {};

  if (
    !req.session?.passwordVerified
  ) {
    return res.status(401).json({
      error:
        "Password verification required",
    });
  }

  if (
    !/^\d{6}$/.test(
      String(code ?? "")
    )
  ) {
    return res.status(400).json({
      error:
        "Enter a valid 6-digit verification code",
    });
  }

  const result =
    await verifyLoginCode(code);

  if (!result.valid) {
    return res.status(401).json({
      error: result.reason,
    });
  }

  delete req.session.passwordVerified;
  delete req.session.otpSentAt;

  return finishLogin(
    req,
    res,
    rememberDevice
  );
}

export async function resendEmailCodeController(
  req,
  res
) {
  if (
    !req.session?.passwordVerified
  ) {
    return res.status(401).json({
      error:
        "Password verification required",
    });
  }

  const lastSent =
    req.session.otpSentAt ?? 0;

  const elapsed =
    Date.now() - lastSent;

  const cooldown =
    60 * 1000;

  if (elapsed < cooldown) {
    return res.status(429).json({
      error:
        "Please wait before requesting another code",
      retryAfterSeconds:
        Math.ceil(
          (cooldown - elapsed) /
            1000
        ),
    });
  }

  const code =
    generateLoginCode();

  await createLoginCode(code);

  try {
    await sendAdminLoginCode(code);
  } catch (error) {
    console.error(
      "Unable to resend admin login code:",
      error.message
    );

    return res.status(503).json({
      error:
        "Unable to send verification code",
    });
  }

  req.session.otpSentAt =
    Date.now();

  return res.json({
    success: true,
    destination:
      maskedAdminEmail(),
  });
}

export async function sessionController(
  req,
  res
) {
  if (
    req.session
      ?.adminAuthenticated
  ) {
    return res.json({
      authenticated: true,

      user: {
        username:
          ENV.admin.username,

        email:
          ENV.admin.email,
      },
    });
  }

  const trustedToken =
    req.cookies?.[
      TRUST_COOKIE
    ];

  const trusted =
    await validateTrustedDevice(
      trustedToken
    );

  if (trusted) {
    req.session.adminAuthenticated =
      true;

    req.session.adminIdentifier =
      ENV.admin.email;

    return res.json({
      authenticated: true,
      trustedDevice: true,

      user: {
        username:
          ENV.admin.username,

        email:
          ENV.admin.email,
      },
    });
  }

  return res.status(401).json({
    authenticated: false,
  });
}

export async function logoutController(
  req,
  res
) {
  const trustedToken =
    req.cookies?.[
      TRUST_COOKIE
    ];

  await revokeTrustedDevice(
    trustedToken
  );

  res.clearCookie(
    TRUST_COOKIE,
    {
      path:
        "/api/v1/admin",
    }
  );

  req.session.destroy(() => {
    res.clearCookie(
      "ikevvy_admin_session"
    );

    res.json({
      success: true,
    });
  });
}
