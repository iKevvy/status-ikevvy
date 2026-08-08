export const ENV = {
  kuma: {
    url: process.env.KUMA_URL || "",
    apiKey: process.env.KUMA_API_KEY || "",
  },

  pelican: {
    url: process.env.PELICAN_URL || "",
    applicationApiKey:
      process.env.PELICAN_APPLICATION_API_KEY || "",
    clientApiKey:
      process.env.PELICAN_CLIENT_API_KEY || "",
  },

  admin: {
    username: process.env.ADMIN_USERNAME || "",
    email: process.env.ADMIN_EMAIL || "",
    passwordHash: process.env.ADMIN_PASSWORD_HASH || "",
    sessionSecret: process.env.SESSION_SECRET || "",
  },

  mail: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || "",
    password: process.env.SMTP_PASSWORD || "",
    from: process.env.MAIL_FROM || "",
    to: process.env.MAIL_TO || "",
  },

  pollIntervalMs: 120000,
  historyLimit: 60,
};
