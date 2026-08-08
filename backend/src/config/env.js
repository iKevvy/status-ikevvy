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

  pollIntervalMs: 120000,
  historyLimit: 60,
};
