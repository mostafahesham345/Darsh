import nodemailer from 'nodemailer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');

let transporter = null;
let initError = null;

/* Inline-embed the brand logos (CID) so they render in every email client
   without depending on a publicly-hosted image URL. */
const CID_LOGO = 'darsh-logo';   // wordmark, for the header
const CID_MARK = 'darsh-mark';   // square mark, for the footer

function loadImage(file) {
  try {
    return fs.readFileSync(path.join(IMAGES_DIR, file));
  } catch {
    return null;
  }
}
const logoBuffer = loadImage('Logo.png');      // primary brand logo (header)
const markBuffer = loadImage('Logo.png');      // footer mark
export const hasLogo = Boolean(logoBuffer);

function brandAttachments() {
  const out = [];
  if (logoBuffer) out.push({ filename: 'darsh-logo.png', content: logoBuffer, cid: CID_LOGO, contentType: 'image/png' });
  if (markBuffer) out.push({ filename: 'darsh-mark.png', content: markBuffer, cid: CID_MARK, contentType: 'image/png' });
  return out;
}

try {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    throw new Error('SMTP_HOST / SMTP_USER / SMTP_PASSWORD missing from .env');
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
  console.log(`[mail] transporter ready (${process.env.SMTP_USER})`);
} catch (err) {
  initError = err;
  console.warn(`[mail] not ready — ${err.message}. Emails will be skipped.`);
}

export function mailReady() {
  return transporter !== null;
}

export function mailError() {
  return initError;
}

function fromAddress() {
  const name = process.env.SMTP_FROM_NAME || process.env.BUSINESS_NAME || 'Darsh';
  const email = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  return `"${name}" <${email}>`;
}

export async function sendMail({ to, subject, html, attachments, replyTo }) {
  if (!transporter) {
    console.warn(`[mail] skipped "${subject}" → ${to} (transporter not ready)`);
    return { skipped: true };
  }
  const info = await transporter.sendMail({
    from: fromAddress(),
    to,
    replyTo,
    subject,
    html,
    // Brand logos are appended to every message as inline (CID) attachments.
    attachments: [...brandAttachments(), ...(attachments || [])],
  });
  return { ok: true, messageId: info.messageId };
}

/* ---------------------------------------------------------------------------
   Email shell — premium, responsive, brand-styled.
   Logos are embedded as inline CID attachments (see brandAttachments()).
   --------------------------------------------------------------------------- */
const FONT_STACK = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const HEAD_STACK = "'Space Grotesk','Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export function emailShell({ title, preheader, bodyHtml }) {
  const brand = process.env.BUSINESS_NAME || 'Darsh';
  const tagline = process.env.BUSINESS_TAGLINE || 'Software, built to last.';
  const contact = process.env.CONTACT_EMAIL || process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || '';
  const year = new Date().getFullYear();
  const hostedLogo = process.env.BUSINESS_LOGO_URL || '';

  // Header brand: prefer the inline-embedded wordmark; fall back to a hosted
  // URL, then to styled text so the email always looks intentional.
  const headerBrand = hasLogo
    ? `<img src="cid:${CID_LOGO}" alt="${escapeHtml(brand)}" height="96" style="height:96px;width:auto;max-width:280px;display:inline-block;border:0;outline:none;text-decoration:none;" />`
    : hostedLogo
      ? `<img src="${escapeHtml(hostedLogo)}" alt="${escapeHtml(brand)}" height="96" style="height:96px;width:auto;display:inline-block;border:0;" />`
      : `<span style="font-family:${HEAD_STACK};font-weight:700;font-size:26px;letter-spacing:0.18em;color:#f7e27e;">${escapeHtml(brand).toUpperCase()}</span>`;

  const footerMark = hasLogo
    ? `<img src="cid:${CID_MARK}" alt="" width="30" height="30" style="width:30px;height:30px;display:inline-block;border:0;opacity:0.9;" />`
    : '';

  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light only" />
  <title>${escapeHtml(title)}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@600;700&display=swap');
    body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { -ms-interpolation-mode:bicubic; border:0; line-height:100%; outline:none; text-decoration:none; }
    body { margin:0 !important; padding:0 !important; width:100% !important; }
    a { text-decoration:none; }
    .es-content a { color:#0a1f44; }
    @media only screen and (max-width:620px) {
      .es-card { width:100% !important; border-radius:0 !important; }
      .es-pad { padding-left:24px !important; padding-right:24px !important; }
      .es-head { padding-left:24px !important; padding-right:24px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#eef1f7;font-family:${FONT_STACK};color:#0a1f44;">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;color:#eef1f7;">${escapeHtml(preheader || '')}</div>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#eef1f7;">
    <tr>
      <td align="center" style="padding:36px 16px;">
        <table role="presentation" class="es-card" cellspacing="0" cellpadding="0" border="0" width="600" style="width:600px;max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 16px 48px rgba(10,31,68,0.14);border:1px solid rgba(10,31,68,0.06);">

          <!-- Header -->
          <tr>
            <td class="es-head" align="center" bgcolor="#0a1f44" style="background-color:#0a1f44;background-image:linear-gradient(135deg,#0a1f44 0%,#15336b 60%,#1a3a7a 100%);padding:34px 40px;text-align:center;">
              ${headerBrand}
            </td>
          </tr>
          <!-- Brand accent bar -->
          <tr>
            <td style="height:4px;line-height:4px;font-size:0;background-color:#f7e27e;background-image:linear-gradient(90deg,#ffd24a 0%,#f7e27e 50%,#ffd24a 100%);">&nbsp;</td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="es-pad es-content" style="padding:40px 44px;color:#0a1f44;font-family:${FONT_STACK};font-size:15px;line-height:1.65;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="es-pad" align="center" style="padding:28px 40px 30px;background-color:#f6f8fc;border-top:1px solid #e7ecf5;text-align:center;">
              ${footerMark ? `<div style="margin-bottom:8px;">${footerMark}</div>` : ''}
              <div style="font-family:${HEAD_STACK};font-weight:700;font-size:15px;letter-spacing:0.02em;color:#0a1f44;">${escapeHtml(brand)}</div>
              <div style="font-family:${FONT_STACK};font-size:12px;color:#8a94a6;margin-top:3px;">${escapeHtml(tagline)}</div>
              ${contact ? `<div style="margin-top:14px;"><a href="mailto:${escapeHtml(contact)}" style="font-family:${FONT_STACK};font-size:12px;color:#0a1f44;font-weight:600;">${escapeHtml(contact)}</a></div>` : ''}
              <div style="font-family:${FONT_STACK};font-size:11px;color:#aab2c4;margin-top:14px;line-height:1.5;">&copy; ${year} ${escapeHtml(brand)}. All rights reserved.<br/>This is an automated message — you can reply directly to reach us.</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function money(amount, currency = 'USD') {
  const n = Number(amount) || 0;
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}
