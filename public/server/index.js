require('dotenv').config();

const path = require('path');
const express = require('express');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

const {
  ALEAD_MAIL_SMTP_HOST,
  ALEAD_MAIL_SMTP_PORT,
  ALEAD_MAIL_SMTP_USER,
  ALEAD_MAIL_SMTP_PASS,
  ALEAD_MAIL_FROM,
  ALEAD_MAIL_TO,
} = process.env;

const transporter = nodemailer.createTransport({
  host: ALEAD_MAIL_SMTP_HOST,
  port: Number(ALEAD_MAIL_SMTP_PORT) || 587,
  secure: Number(ALEAD_MAIL_SMTP_PORT) === 465,
  auth: {
    user: ALEAD_MAIL_SMTP_USER,
    pass: ALEAD_MAIL_SMTP_PASS,
  },
});

app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// simple in-memory rate limit: max 5 submissions per IP per 10 minutes
const submissions = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const timestamps = (submissions.get(ip) || []).filter((t) => now - t < windowMs);
  timestamps.push(now);
  submissions.set(ip, timestamps);
  return timestamps.length > 5;
}

app.post('/api/contact', async (req, res) => {
  try {
    const ip = req.ip;
    if (isRateLimited(ip)) {
      return res.status(429).json({ ok: false, error: 'Too many submissions. Please try again later.' });
    }

    // all fields are optional — collect whatever the visitor chose to share
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim();
    const phone = String(req.body.phone || '').trim();
    const message = String(req.body.message || '').trim();
    // 'chatbot' when this came from Nova's lead-capture card instead of the contact form
    const source = req.body.source === 'chatbot' ? 'chatbot' : 'form';
    const transcript = source === 'chatbot' ? String(req.body.transcript || '').trim().slice(0, 4000) : '';

    if (name.length > 120 || email.length > 200 || phone.length > 30 || message.length > 5000) {
      return res.status(400).json({ ok: false, error: 'One of the fields is too long.' });
    }
    if (email && !EMAIL_RE.test(email)) {
      return res.status(400).json({ ok: false, error: 'Please enter a valid email address.' });
    }

    const displayName = name || 'Website visitor';
    const subject = source === 'chatbot'
      ? `New chatbot lead from ${displayName}`
      : `New contact form submission from ${displayName}`;

    await transporter.sendMail({
      from: `"Alead Website" <${ALEAD_MAIL_FROM}>`,
      to: ALEAD_MAIL_TO,
      ...(email ? { replyTo: email } : {}),
      subject,
      text: `Name: ${name || '(not provided)'}\nEmail: ${email || '(not provided)'}\nPhone: ${phone || '(not provided)'}\n\nMessage:\n${message || '(not provided)'}` +
        (transcript ? `\n\nChat transcript:\n${transcript}` : ''),
      html: `<p><b>Name:</b> ${escapeHtml(name) || '(not provided)'}</p><p><b>Email:</b> ${escapeHtml(email) || '(not provided)'}</p><p><b>Phone:</b> ${escapeHtml(phone) || '(not provided)'}</p><p><b>Message:</b></p><p>${escapeHtml(message).replace(/\n/g, '<br>') || '(not provided)'}</p>` +
        (transcript ? `<p><b>Chat transcript:</b></p><p>${escapeHtml(transcript).replace(/\n/g, '<br>')}</p>` : ''),
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('Contact form error:', err);
    res.status(500).json({ ok: false, error: 'Something went wrong sending your message. Please try again.' });
  }
});

app.post('/api/referral', async (req, res) => {
  try {
    const ip = req.ip;
    if (isRateLimited(ip)) {
      return res.status(429).json({ ok: false, error: 'Too many submissions. Please try again later.' });
    }

    const referrerName = String(req.body.referrerName || '').trim();
    const referrerPhone = String(req.body.referrerPhone || '').trim();
    const tenantId = String(req.body.tenantId || '').trim();

    if (referrerName.length > 120 || referrerPhone.length > 30 || tenantId.length > 60) {
      return res.status(400).json({ ok: false, error: 'One of the fields is too long.' });
    }
    if (!referrerName || !referrerPhone) {
      return res.status(400).json({ ok: false, error: 'Please enter your name and phone number.' });
    }

    const subject = `New referral signup from ${referrerName}`;

    await transporter.sendMail({
      from: `"Alead Website" <${ALEAD_MAIL_FROM}>`,
      to: ALEAD_MAIL_TO,
      subject,
      text: `Name: ${referrerName}\nPhone: ${referrerPhone}\nTenant ID: ${tenantId || '(not an existing customer)'}`,
      html: `<p><b>Name:</b> ${escapeHtml(referrerName)}</p><p><b>Phone:</b> ${escapeHtml(referrerPhone)}</p><p><b>Tenant ID:</b> ${escapeHtml(tenantId) || '(not an existing customer)'}</p>`,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('Referral form error:', err);
    res.status(500).json({ ok: false, error: 'Something went wrong sending your referral. Please try again.' });
  }
});

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

app.listen(PORT, () => {
  console.log(`Alead website + contact API running at http://localhost:${PORT}`);
});
