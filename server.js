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

const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "tasksphereit-b53c8",
      clientEmail:
        "firebase-adminsdk-abc12@tasksphereit-b53c8.iam.gserviceaccount.com",
      privateKey:
        "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCUJDHqRVWAk1qF\ncCA3s7LAMuYoqor7VuSbc9fhmDq+HwllDBjKGYXSZihJ/cbkAnFyAESD8ZyaVcNY\nIS/6qQXuBf00e/RbgC6HWY6jhhVTNfqu/hs/2SmMK10OZMcbaiL4B9Uk4rob3zFr\nPWdZFkbPn5ws9oKANma0qnqZJw8Llz/c07z3cimaQD3rp31/AuxkXaSFXr4q2eUT\n4sPMlxgqB+2cXaj4MRCmBTHE9Orih7IkGVKkUKWribwXWCBEyiB/bF7H88ZOlFy6\nyOYW/Fz/PBL9LcMd693Wq7dePr47/PUrITZ5LuKv+BN2EuhaRlNt8QrVabdb1DtI\n7cSu6yu1AgMBAAECggEAF86uT+g3GrvzoPy5TMJeEHnNl8z6m3RmNl5aXBi3Hg1G\nWP0l8brC0SKWSHfWkhebbDcDS9IVOQ9d3qisuYOW3p8LR3dBOMBDmgBoRjra6/3B\njQRs1Ci9/tcMNC85eVwoBQTbOfuO7cJDgqjCVmSYWi8cLfSq2diETnYUUE8g4Zt9\nMYKvB7xGF9Rygh42DSVkdOu4HH7RkFuYgiEy2D84zoz0E695l4259hBAcqTCldol\n+Jq+CV2BKmyiSwD1+xrmJ7jeclWsrTFf1KB5f9vb4TXB2P5yC6Oj/D0OHDRATXPS\nt5efLV66Y+LYrmffl46O/WwsZAVDC45Z6ghO3KmuuQKBgQDDwn/JisMF1XxvsXma\nF2e6Hgg9diuESFWXeSvkTXvIOckrmt+P+L0RUG/Llc0lMHAB9oAnlRcX/ByZ9Oad\nNNTv9NsuSWhTGhyPs2OS+Nutp7HzDbyBhiZuc5iObvpPPQS3nUxrRdaypdpWw4HN\nw3Zq1H7v59QeeNOqhTQpVossqQKBgQDBum4wQ+J8ICS2b5ZGDieDnsxVH0fJrTWP\nYLbo/UwbGJTJcK/BNwisLnaoUW8w1Dsq4220gkvAhgsq5+CWBpWkLPBO2qBN9wCP\nSOfwBNWXRV4FAo7qPwGVhsq+Mwrv1rWWpQ3BTVFslv1dlLL5iMP5GpTDsbIuCNsP\nxI1XbyMCLQKBgGL3+Tz+f1x6sx+Q3UaPIKzStB3GmXeWTld3Nj6FAdiXhmIaOX6D\nJasUPIDzqjRsCaSkZ+QbFwLUPe2EB/dgl2r9IraC/FBPOjNYYTYTxJRF3MxhnHTr\nSpC6tl0ENF5NHg5qYxE0zLei7ADDdON/N2YJKmfFj9McCP8DuvxPOauJAoGAalh0\n9HnPcmQSwzMuQvayKkaZ1IB/X+59YF+vCOdDR/yOcKYzVNVpJVu8N1m8uAlJEZoX\nNufvvZfXuY3gc3rZ2m3w3NiW9zWIUR+scs20kn25xvZIjb5YmESONyq97jrnI/Mn\nQd23vOyF2UEvnlu9eJlm4KZDMZIa7uTu0fhoN2ECgYEAuTvQiTuVk1BZasCvN7P2\n7ICXqJxr7JOdDD4o5udeF3v5leWAwwdYq+I0uhVvAuEYyZj47fdXohuY1tS4gouo\nBEk1cnEQEuS+yLZneeCzsX54EiTndPFVgqJ4AMO5QthLI/sSEk9+0fmhxkAzgEac\n4MWn7fLZBbEOoz/vCSC/MTs=\n-----END PRIVATE KEY-----\n",
    }),
  });
}

app.post("/api/updatePassword", async (req, res) => {
  try {
    const { email, newPassword } = req.body || {};
    if (!email || !newPassword) {
      return res.status(400).json({ error: "Missing email or newPassword" });
    }
    const user = await admin.auth().getUserByEmail(String(email).trim());
    await admin.auth().updateUser(user.uid, { password: String(newPassword) });
    return res.json({ success: true });
  } catch (err) {
    console.error("updatePassword error:", err);
    const msg =
      err?.errorInfo?.message || err?.message || "Failed to update password";
    return res.status(400).json({ error: msg });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
