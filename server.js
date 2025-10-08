// server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 8080; // keep 8080 since your .env uses it

app.use(cors());
app.use(bodyParser.json());

// ---- shared transporter factory (Gmail App Password recommended) ----
function makeTransporter() {
  // If you want to keep "service: 'gmail'" it's fine; or use host/port below.
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // Gmail address
      pass: process.env.EMAIL_PASS, // Gmail app password
    },
  });

  // Alternative (explicit host/port):
  // return nodemailer.createTransport({
  //   host: process.env.SMTP_HOST || "smtp.gmail.com",
  //   port: Number(process.env.SMTP_PORT || 465), // 465 TLS or 587 STARTTLS
  //   secure: (process.env.SMTP_PORT || "465") === "465",
  //   auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  // });
}

// Helper to register one handler on TWO paths (root + /api/*)
function postBoth(paths, handler) {
  app.post(paths, handler); // paths can be array
}

// ===================== /sendOTP & /api/sendOTP =====================
postBoth(["/sendOTP", "/api/sendOTP"], async (req, res) => {
  const { email, otp, name } = req.body;

  try {
    const htmlContent = `
    <html>
    <head>
      <meta charset="UTF-8">
      <title>OTP Email Template</title>
      <style>
        body { font-family: 'Poppins', Arial, sans-serif; background-color: #f8f9fa; }
        .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; text-align: center; padding: 32px 0; }
        .email-container { max-width: 600px; margin: 40px auto; border-radius: 12px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.1); background: #fff; }
        .otp-digit { display: inline-block; width: 45px; height: 45px; font-size: 1.25rem; font-weight: 600; line-height: 45px; background: #fff; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin: 0 4px; }
        .otp-container { background: #f8f9fa; border-radius: 10px; padding: 15px 0; display: inline-block; }
        .alert { background: #fff3cd; color: #856404; border-radius: 6px; padding: 12px 16px; margin: 24px 0; }
        @media (max-width: 576px) {
          .otp-digit { width: 35px; height: 35px; font-size: 1rem; line-height: 35px; }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="gradient-bg">
          <div style="font-size:2rem; margin-bottom:12px;">🔒</div>
          <h2 style="margin:0 0 8px;">Your Verification Code</h2>
          <p style="margin:0; opacity:0.8;">Secure access to your account</p>
        </div>
        <div style="padding:32px;">
          <p>Hello <strong>${name || "Customer"}</strong>,</p>
          <p>We received a request to access your account. Please use the following One-Time Password (OTP) to verify your identity:</p>
          <div style="text-align:center; margin:32px 0;">
            <div class="otp-container">
              ${otp
                .toString()
                .split("")
                .map((digit) => `<span class="otp-digit">${digit}</span>`)
                .join("")}
            </div>
          </div>
          <div class="alert">
            If you didn't request this code, please ignore this email or contact support if you have concerns.
          </div>
        </div>
      </div>
    </body>
    </html>
    `;

    const transporter = makeTransporter();

    await transporter.sendMail({
      from: `"OLGP Servers" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      html: htmlContent,
    });

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// ================= /sendWelcome & /api/sendWelcome =================
postBoth(["/sendWelcome", "/api/sendWelcome"], async (req, res) => {
  let { email, name, idNumber, tempPassword } = req.body;

  if (!email) return res.status(400).json({ error: "Email is required" });
  if (typeof email !== "string")
    return res.status(400).json({ error: "Email must be a string" });

  email = email.trim();
  if (!email) return res.status(400).json({ error: "Email cannot be empty" });

  try {
    const timestamp = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Manila",
      dateStyle: "full",
      timeStyle: "short",
    });

    const htmlContent = `
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          body { font-family: 'Poppins', Arial, sans-serif; background:#f8f9fa; color:#212529; }
          .wrap { max-width: 620px; margin: 40px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 5px 15px rgba(0,0,0,0.08); }
          .hero { background: linear-gradient(135deg, #667eea, #764ba2); color:#fff; text-align:center; padding:28px 20px; }
          .hero h2 { margin:8px 0 0; font-weight:700; }
          .content { padding:28px; }
          .kbd { display:inline-block; background:#212529; color:#fff; padding:6px 10px; border-radius:6px; font-weight:600; letter-spacing:0.3px; }
          .note { background:#f1f3f5; padding:14px 16px; border-radius:8px; margin-top:16px; }
          .timestamp { font-size:0.875rem; color:#6c757d; margin-top:18px; }
        </style>
      </head>
      <body>
        <div class="wrap">
          <div class="hero">
            <div style="font-size:28px;">🎉 Welcome to OLGP Servers</div>
            <h2>We're glad you're here, ${name || "Member"}!</h2>
          </div>
          <div class="content">
            <p>Hello <strong>${name || "Member"}</strong>,</p>
            <p>Your account has been created. Here are your sign-in details:</p>
            <ul class="list">
              <li><strong>ID Number:</strong> <span class="kbd">${idNumber}</span></li>
              <li><strong>Password:</strong> <span class="kbd">${tempPassword}</span></li>
            </ul>

            <a href="https://olgp-servers.example.com/login" 
              style="display:inline-block;margin-top:20px;padding:12px 20px;background:#667eea;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
              Go to Login Page
            </a>

            <div class="note">
              For security, please sign in and change your password as soon as possible.
            </div>

            <p class="timestamp">📅 Sent on ${timestamp}</p>

            <p>If you didn’t expect this email, you can safely ignore it.</p>
            <p>— OLGP Servers Team</p>
          </div>
        </div>
      </body>
    </html>
    `;

    const transporter = makeTransporter();

    await transporter.sendMail({
      from: `"OLGP Servers" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to OLGP Servers — Your Login Details",
      html: htmlContent,
    });

    res.status(200).json({ message: "Welcome email sent" });
  } catch (error) {
    console.error("Error sending welcome email:", error);
    res.status(500).json({ error: "Failed to send welcome email" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
