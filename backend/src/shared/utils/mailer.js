const nodemailer = require('nodemailer');

const sendMail = async ({ to, subject, html }) => {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        // Low timeout so it fails quickly if offline rather than hanging
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
      });

      const info = await transporter.sendMail({
        from: `"SocietyOS" <${smtpUser}>`,
        to,
        subject,
        html,
      });

      console.log(`[Email] Sent successfully to ${to}. Message ID: ${info.messageId}`);
      return info;
    } catch (error) {
      console.warn(`[Email] Failed to send via SMTP (possibly offline). Falling back to console log. Error: ${error.message}`);
    }
  }

  // Fallback / Offline mode
  console.log(`\n=== OFFLINE MOCK EMAIL ===\nTo: ${to}\nSubject: ${subject}\nContent: ${html.substring(0, 200)}...\n==========================\n`);
  return { messageId: 'mock-id-' + Date.now() };
};

module.exports = { sendMail };

