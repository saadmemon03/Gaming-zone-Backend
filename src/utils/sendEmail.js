import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (!smtpEmail || !smtpPassword) {
    throw new Error("SMTP_EMAIL and SMTP_PASSWORD are required in gaming-api/.env");
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== "false",
    auth: {
      user: smtpEmail,
      pass: smtpPassword,
    },
  });

  const message = {
    from: `${process.env.FROM_NAME || "GameZone"} <${smtpEmail}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  await transporter.sendMail(message);
};

export default sendEmail;
