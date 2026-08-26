const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('SMTP not configured — emails will be logged to console instead of sent.');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

async function sendEmail({ to, subject, html }) {
  const t = getTransporter();
  if (!t) {
    console.log(`[EMAIL - not sent, SMTP not configured] To: ${to} | Subject: ${subject}`);
    console.log(html);
    return;
  }
  try {
    await t.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
}

// --- Templated senders used across the app ---

exports.sendSellerRequestNotice = (adminEmail, seller) =>
  sendEmail({
    to: adminEmail,
    subject: 'New seller approval request — RP Car Showroom',
    html: `<p><strong>${seller.name}</strong> (${seller.email}) has requested seller access.</p>
           <p>Log in to the admin panel to approve or reject this request.</p>`,
  });

exports.sendSellerStatusEmail = (seller, approved) =>
  sendEmail({
    to: seller.email,
    subject: approved
      ? 'Your seller account has been approved — RP Car Showroom'
      : 'Update on your seller request — RP Car Showroom',
    html: approved
      ? `<p>Hi ${seller.name},</p><p>Your seller account has been approved. You can now list cars for sale from your Seller Dashboard.</p>`
      : `<p>Hi ${seller.name},</p><p>Your seller request was not approved at this time. Contact support for details.</p>`,
  });

exports.sendBookingRequestNotice = (adminEmail, booking, car, buyer) =>
  sendEmail({
    to: adminEmail,
    subject: `New test-ride request — ${car.title}`,
    html: `<p><strong>${buyer.name}</strong> (${buyer.email}) requested a test ride for <strong>${car.title}</strong>.</p>
           <p>Preferred date: ${new Date(booking.preferredDate).toLocaleString()}</p>
           <p>Message: ${booking.message || '(none)'}</p>
           ${booking.wantsInsuranceHelp ? `<p><strong>Also requested insurance help:</strong> ${booking.insuranceNotes || '(no additional notes)'}</p>` : ''}
           <p>Log in to the admin panel to confirm or reject.</p>`,
  });

exports.sendBookingStatusEmail = (buyer, car, booking) =>
  sendEmail({
    to: buyer.email,
    subject:
      booking.status === 'confirmed'
        ? `Your test ride is confirmed — ${car.title}`
        : `Update on your test-ride request — ${car.title}`,
    html:
      booking.status === 'confirmed'
        ? `<p>Hi ${buyer.name},</p>
           <p>Your test ride for <strong>${car.title}</strong> on
           ${new Date(booking.preferredDate).toLocaleString()} has been <strong>confirmed</strong>.</p>
           ${booking.adminNote ? `<p>Note from showroom: ${booking.adminNote}</p>` : ''}`
        : `<p>Hi ${buyer.name},</p>
           <p>Your test ride request for <strong>${car.title}</strong> was
           <strong>${booking.status}</strong>.</p>
           ${booking.adminNote ? `<p>Note: ${booking.adminNote}</p>` : ''}`,
  });

exports.sendInsuranceRequestNotice = (adminEmail, request, buyer) =>
  sendEmail({
    to: adminEmail,
    subject: `New insurance quote request — ${request.car.title}`,
    html: `<p><strong>${buyer.name}</strong> (${buyer.email}) requested an insurance quote for
           <strong>${request.car.title}</strong>.</p>
           <p>Plan: ${request.plan.name} (${request.plan.provider})</p>
           <p>Calculated premium: ₹${request.calculatedPremium.toLocaleString()}</p>
           <p>Notes: ${request.notes || '(none)'}</p>
           <p>Log in to the admin panel to issue or reject this policy.</p>`,
  });

exports.sendInsuranceStatusEmail = (buyer, request) =>
  sendEmail({
    to: buyer.email,
    subject:
      request.status === 'issued'
        ? `Your insurance policy is ready — ${request.car.title}`
        : `Update on your insurance request — ${request.car.title}`,
    html:
      request.status === 'issued'
        ? `<p>Hi ${buyer.name},</p>
           <p>Your insurance policy for <strong>${request.car.title}</strong> has been
           <strong>issued</strong>.</p>
           <p>Policy number: ${request.policyNumber}</p>
           <p>Premium: ₹${(request.finalPremium || request.calculatedPremium).toLocaleString()}</p>
           ${request.policyValidTill ? `<p>Valid till: ${new Date(request.policyValidTill).toLocaleDateString()}</p>` : ''}
           ${request.adminNote ? `<p>Note from showroom: ${request.adminNote}</p>` : ''}
           <p>Log in to My Insurance to view/download your policy document.</p>`
        : `<p>Hi ${buyer.name},</p>
           <p>Your insurance request for <strong>${request.car.title}</strong> was
           <strong>${request.status}</strong>.</p>
           ${request.adminNote ? `<p>Note: ${request.adminNote}</p>` : ''}`,
  });

exports.sendPasswordResetEmail = (user, resetUrl) =>
  sendEmail({
    to: user.email,
    subject: 'Reset your password — RP Car Showroom',
    html: `<p>Hi ${user.name},</p>
           <p>We received a request to reset your password. Click the link below to
           choose a new one — this link expires in 1 hour.</p>
           <p><a href="${resetUrl}">${resetUrl}</a></p>
           <p>If you didn't request this, you can safely ignore this email — your
           password will remain unchanged.</p>`,
  });
