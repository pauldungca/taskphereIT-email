const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

function makeTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

function postBoth(paths, handler) {
  app.post(paths, handler);
}

postBoth(["/sendOTP", "/api/sendOTP"], async (req, res) => {
  const { email, otp, name } = req.body;

  try {
    if (!email || !otp) {
      return res.status(400).json({ error: "Missing email or otp" });
    }

    const htmlContent = `
    <html>
    <head>
      <meta charset="UTF-8">
      <title>OTP Email Template</title>
      <style>
        body { font-family: 'Poppins', Arial, sans-serif; background-color: #f8f9fa; }
        .gradient-bg { background: linear-gradient(135deg, #3B0304 0%, #2A0203 100%); color: #fff; text-align: center; padding: 32px 0; }
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
          <p>Hello <strong>${name || "Admin"}</strong>,</p>
          <p>We received a request to access your account. Please use the following One-Time Password (OTP) to verify your identity:</p>
          <div style="text-align:center; margin:32px 0;">
            <div class="otp-container">
              ${String(otp)
                .split("")
                .map((d) => `<span class="otp-digit">${d}</span>`)
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
      from: `"Taskphere IT" <${process.env.EMAIL_USER}>`,
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

postBoth(["/sendLogin", "/api/sendLogin"], async (req, res) => {
  const { email, name } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ error: "Missing email" });
    }

    const htmlContent = `
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Instructor Invitation</title>
      <style>
        body { font-family: 'Poppins', Arial, sans-serif; background-color: #f8f9fa; }
        .gradient-bg { background: linear-gradient(135deg, #3B0304 0%, #2A0203 100%); color: #fff; text-align: center; padding: 32px 0; }
        .email-container { max-width: 600px; margin: 40px auto; border-radius: 12px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.1); background: #fff; }
        .alert { background: #fff3cd; color: #856404; border-radius: 6px; padding: 12px 16px; margin: 24px 0; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="gradient-bg">
          <div style="font-size:2rem; margin-bottom:12px;">🎉</div>
          <h2 style="margin:0 0 8px;">Welcome to TaskSphereIT!</h2>
          <p style="margin:0; opacity:0.8;">We are excited to have you as a new instructor!</p>
        </div>
        <div style="padding:32px;">
          <p>Hello <strong>${name || "Instructor"}</strong>,</p>
          <p>We are pleased to invite you to join our platform, TaskSphereIT, as a new instructor. Please click the link below to access the system and get started:</p>
          <div style="text-align:center; margin:32px 0;">
            <a href="task-sphere-it.vercel.app" style="font-size: 18px; color: #fff; background-color: #3B0304; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Go to TaskSphereIT</a>
          </div>
          <div class="alert">
            If you didn't request this invitation, please ignore this email or contact support.
          </div>
        </div>
      </div>
    </body>
    </html>
    `;

    const transporter = makeTransporter();

    await transporter.sendMail({
      from: `"TaskSphere IT" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to TaskSphereIT - Instructor Invitation",
      html: htmlContent,
    });

    res.status(200).json({ message: "Invitation sent successfully" });
  } catch (error) {
    console.error("Error sending invitation:", error);
    res.status(500).json({ error: "Failed to send invitation" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
