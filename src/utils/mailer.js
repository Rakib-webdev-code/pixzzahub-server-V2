import nodemailer from 'nodemailer';
import env from '../config/env.js';

let transporter = null;
if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
}

export async function sendOrderStatusEmail({ to, customerName, itemName, status }) {
  if (!transporter) return;
  const subject = `Your PizzaHub order was ${status}`;
  const html = `
    <div style="font-family:Arial;padding:24px;background:#fff7ed">
      <h2 style="color:#dc2626">Hi ${customerName},</h2>
      <p>Your order for <b>${itemName}</b> has been <b>${status}</b>.</p>
      <p style="color:#6b7280">— PizzaHub Team</p>
    </div>
  `;
  await transporter.sendMail({ from: env.MAIL_FROM, to, subject, html });
}