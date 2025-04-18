const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a transporter with fallback to console output if no credentials
let transporter;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS && 
    process.env.EMAIL_USER !== 'your-email@gmail.com' && 
    process.env.EMAIL_PASS !== 'your-email-app-password') {
  // Real email transport
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  console.log('Email service configured with real credentials');
} else {
  // Development/testing transport that logs to console
  console.log('WARNING: Using development email transport. Emails will be logged to console instead of being sent.');
  transporter = {
    sendMail: (mailOptions) => {
      console.log('==================== EMAIL NOT SENT (DEVELOPMENT MODE) ====================');
      console.log('To:', mailOptions.to);
      console.log('Subject:', mailOptions.subject);
      console.log('Content:', mailOptions.html ? '[HTML Content]' : mailOptions.text);
      console.log('Verification Link:', mailOptions.html ? mailOptions.html.match(/href="([^"]+)"/)[1] : 'Not found');
      console.log('=======================================================================');
      return Promise.resolve({ messageId: 'dev-mode-' + Date.now() });
    }
  };
}

// Function to send verification email
const sendVerificationEmail = async (email, token) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER || 'noreply@vitdatingapp.com',
    to: email,
    subject: 'Verify Your VIT Dating App Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6200ea;">Verify Your VIT Dating App Email</h2>
        <p>Hi there,</p>
        <p>Thank you for registering with VIT Dating App. To complete your registration, please verify your email by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #6200ea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
        </div>
        <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; font-size: 14px;"><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>This verification link will expire in 24 hours.</p>
        <p>If you didn't sign up for our service, you can safely ignore this email.</p>
        <p>Best regards,<br>VIT Dating App Team</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent or logged:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};

module.exports = {
  sendVerificationEmail
}; 