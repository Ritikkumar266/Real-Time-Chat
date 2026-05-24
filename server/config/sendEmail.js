import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // use STARTTLS
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false, // allow on cloud servers
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

/**
 * Send OTP verification email
 * @param {string} to - Recipient email
 * @param {string} otp - The 6-digit OTP code (plain text)
 */
const sendOtpEmail = async (to, otp) => {
  const mailOptions = {
    from: `"ZingChat" <${process.env.GMAIL_USER}>`,
    to,
    subject: "🔐 ZingChat — Verify Your Email",
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0f1724; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b;">
        <div style="background: linear-gradient(135deg, #06b6d4, #8b5cf6); padding: 32px 24px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 28px;">💬 ZingChat</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Email Verification</p>
        </div>
        <div style="padding: 32px 24px; text-align: center;">
          <p style="color: #94a3b8; font-size: 15px; margin: 0 0 24px;">Use the code below to verify your email address and complete your registration.</p>
          <div style="background: #1e293b; border-radius: 12px; padding: 20px; display: inline-block; letter-spacing: 12px; font-size: 36px; font-weight: 700; color: #06b6d4; border: 2px dashed #334155;">
            ${otp}
          </div>
          <p style="color: #64748b; font-size: 13px; margin: 24px 0 0;">This code expires in <strong style="color: #f59e0b;">10 minutes</strong>.</p>
          <p style="color: #475569; font-size: 12px; margin: 16px 0 0;">If you didn't request this, you can safely ignore this email.</p>
        </div>
        <div style="background: #0b1120; padding: 16px; text-align: center;">
          <p style="color: #475569; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} ZingChat. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export default sendOtpEmail;
