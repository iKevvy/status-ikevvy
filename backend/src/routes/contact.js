import { Router } from "express";
import nodemailer from "nodemailer";
import { ENV } from "../config/env.js";

const router = Router();

const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS = 3;
const attempts = new Map();

const transporter = nodemailer.createTransport({
  host: ENV.mail.host,
  port: ENV.mail.port,
  secure: ENV.mail.port === 465,
  auth: {
    user: ENV.mail.user,
    pass: ENV.mail.password,
  },
});

router.post("/", async (req, res) => {
  const { name, email, message, website } = req.body ?? {};

  // Honeypot: legitimate visitors leave this field empty.
  if (website) {
    return res.json({ success: true });
  }

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof message !== "string"
  ) {
    return res.status(400).json({
      error: "Invalid form data.",
    });
  }

  const cleanName = name.trim();
  const cleanEmail = email.trim();
  const cleanMessage = message.trim();

  if (
    cleanName.length < 2 ||
    cleanName.length > 100 ||
    cleanEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
    cleanMessage.length === 0 ||
    cleanMessage.length > 5000 ||
    /[\r\n]/.test(cleanName + cleanEmail)
  ) {
    return res.status(400).json({
      error: "Please check your name, email, and message.",
    });
  }

  const now = Date.now();
  const ip = req.ip;

  for (const [key, entry] of attempts) {
    if (entry.resetAt <= now) attempts.delete(key);
  }

  const entry = attempts.get(ip);

  if (entry && entry.count >= MAX_REQUESTS) {
    return res.status(429).json({
      error: "Too many messages. Please try again later.",
    });
  }

  attempts.set(ip, {
    count: (entry?.count ?? 0) + 1,
    resetAt: entry?.resetAt ?? now + WINDOW_MS,
  });

  const recipient = process.env.CONTACT_RECIPIENT;
  const sender = process.env.CONTACT_FROM;

  if (!recipient || !sender) {
    return res.status(503).json({
      error: "Contact form is temporarily unavailable.",
    });
  }

  try {
    await transporter.sendMail({
      from: {
        name: "iKevvy Status",
        address: sender,
      },
      to: recipient,
      replyTo: {
        name: cleanName,
        address: cleanEmail,
      },
      subject: "New iKevvy Status contact message",
      text: [
        `Name: ${cleanName}`,
        `Email: ${cleanEmail}`,
        "",
        cleanMessage,
      ].join("\n"),
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("Contact delivery failed:", error.message);

    return res.status(503).json({
      error: "Unable to send your message right now.",
    });
  }
});

export default router;
