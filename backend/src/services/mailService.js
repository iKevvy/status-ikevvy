import nodemailer from "nodemailer";
import { ENV } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: ENV.mail.host,
  port: ENV.mail.port,
  secure: ENV.mail.port === 465,

  auth: {
    user: ENV.mail.user,
    pass: ENV.mail.password,
  },
});

export async function verifyMailConnection() {
  await transporter.verify();
}

export async function sendAdminLoginCode(code) {
  await transporter.sendMail({
    from: `"Melody Wave" <${ENV.mail.from}>`,
    to: ENV.mail.to,

    subject: "Your iKevvy Status verification code",

    text: [
      "Your iKevvy Status verification code is:",
      "",
      code,
      "",
      "This code expires in 10 minutes.",
      "",
      "If you did not attempt to sign in, you can ignore this email.",
    ].join("\n"),

    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#111;">
        <h2>iKevvy Status</h2>

        <p>Your verification code is:</p>

        <div style="
          font-size:32px;
          font-weight:700;
          letter-spacing:8px;
          padding:18px 0;
        ">
          ${code}
        </div>

        <p>This code expires in <strong>10 minutes</strong>.</p>

        <p style="color:#666;font-size:13px;">
          If you did not attempt to sign in, you can ignore this email.
        </p>
      </div>
    `,
  });
}
