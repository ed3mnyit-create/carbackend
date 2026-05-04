const nodemailer = require("nodemailer");

/**
 * Send email using nodemailer
 * Falls back gracefully if email is not configured
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.message - Email body (plain text)
 * @param {string} [options.html] - Email body (HTML)
 * @returns {Promise<boolean>} - True if email sent, false if not configured
 */
const sendEmail = async (options) => {
  // Check if email is configured
  if (
    !process.env.EMAIL_HOST ||
    !process.env.EMAIL_USER ||
    !process.env.EMAIL_PASS
  ) {
    console.log("Email not configured. Skipping email send.");
    return false;
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_PORT === "465", // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_FROM || `Car Rental <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || undefined,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${options.email}`);
    return true;
  } catch (error) {
    console.error("Email send error:", error.message);
    return false;
  }
};

module.exports = sendEmail;
