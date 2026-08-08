import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";

import statusRoute from "./routes/status.js";
import adminRoute from "./routes/admin.js";
import authRoute from "./routes/auth.js";
import servicesRoute from "./routes/services.js";

import { ENV } from "./config/env.js";
import { initDatabase } from "./db.js";
import { refreshStatus } from "./services/statusService.js";
import { requireAdmin } from "./middleware/requireAdmin.js";

const app = express();

const PORT =
  process.env.PORT || 3001;

app.use(express.json());
app.use(cookieParser());

app.use(
  session({
    name:
      "ikevvy_admin_session",

    secret:
      ENV.admin.sessionSecret,

    resave: false,

    saveUninitialized: false,

    cookie: {
      httpOnly: true,
      sameSite: "strict",
      secure: false,
      maxAge:
        1000 *
        60 *
        60 *
        8,
    },
  })
);

app.get(
  "/api/v1/health",
  (req, res) => {
    res.json({
      status: "ok",
      service:
        "Status iKevvy API",
    });
  }
);

app.use(
  "/api/v1/status",
  statusRoute
);

app.use(
  "/api/v1/admin/auth",
  authRoute
);

app.use(
  "/api/v1/admin/services",
  requireAdmin,
  servicesRoute
);

app.use(
  "/api/v1/admin",
  requireAdmin,
  adminRoute
);

app.listen(
  PORT,
  "0.0.0.0",
  async () => {
    console.log(
      `Status iKevvy API running on port ${PORT}`
    );

    try {
      await initDatabase();
      console.log("Database initialized");

      await refreshStatus();

      console.log(
        "Initial status refresh completed"
      );
    } catch (error) {
      console.error(
        "Initial status refresh failed:",
        error.message
      );
    }

    setInterval(() => {
      refreshStatus().catch(
        (error) => {
          console.error(
            "Scheduled status refresh failed:",
            error.message
          );
        }
      );
    }, ENV.pollIntervalMs);
  }
);
