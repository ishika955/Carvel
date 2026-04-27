const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendAlert({ subject, title, message, details }) {
  try {
    await transporter.sendMail({
      from: `"Carvèl Alerts 🏥" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_RECEIVER,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f0e6; border-radius: 10px;">
          <div style="background: #353b2e; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: #c4a96b; font-size: 24px; margin: 0;">Carvèl</h1>
            <p style="color: #f5f0e6; margin: 5px 0 0 0; font-size: 12px; letter-spacing: 2px;">ELDERLY CARE</p>
          </div>
          <div style="background: white; padding: 25px; border-radius: 8px; border-left: 4px solid #c0614a;">
            <h2 style="color: #c0614a; margin-top: 0;">${title}</h2>
            <p style="color: #2a2a22; font-size: 16px;">${message}</p>
            ${details ? `<div style="background: #f5f0e6; padding: 15px; border-radius: 6px; margin-top: 15px;">
              <p style="margin: 0; color: #7a7a68; font-size: 14px;">${details}</p>
            </div>` : ''}
          </div>
          <p style="text-align: center; color: #7a7a68; font-size: 12px; margin-top: 20px;">
            This is an automated alert from Carvèl Elderly Care System.<br/>
            Please check the dashboard for more details.
          </p>
        </div>
      `
    });
    console.log("✅ Alert email sent:", subject);
  } catch (err) {
    console.error("❌ Email failed:", err.message);
  }
}

module.exports = { sendAlert };