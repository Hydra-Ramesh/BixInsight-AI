const { Resend } = require('resend');

class EmailService {
    constructor() {
        this.resend = process.env.RESEND_API_KEY
            ? new Resend(process.env.RESEND_API_KEY)
            : null;
        this.from = process.env.EMAIL_FROM || 'BixInsight AI <onboarding@resend.dev>';
    }

    async sendMail(to, subject, html) {
        try {
            if (!this.resend) {
                console.log(`📧 Email skipped (no RESEND_API_KEY): ${subject} → ${to}`);
                return false;
            }
            await this.resend.emails.send({
                from: this.from,
                to,
                subject,
                html
            });
            console.log(`📧 Email sent: ${subject} → ${to}`);
            return true;
        } catch (error) {
            console.error(`📧 Email failed: ${error.message}`);
            return false;
        }
    }

    _baseTemplate(content) {
        return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { margin: 0; padding: 0; background: #0a0a1a; font-family: 'Segoe UI', Tahoma, sans-serif; }
  .container { max-width: 520px; margin: 0 auto; padding: 40px 20px; }
  .card { background: linear-gradient(135deg, #19193c 0%, #111128 100%); border: 1px solid rgba(148,163,184,0.1); border-radius: 16px; padding: 40px; }
  .logo { text-align: center; margin-bottom: 28px; }
  .logo-text { font-size: 24px; font-weight: 800; color: #f1f5f9; }
  .logo-ai { background: linear-gradient(135deg, #f472b6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .title { font-size: 22px; font-weight: 700; color: #f1f5f9; text-align: center; margin-bottom: 12px; }
  .text { font-size: 15px; color: #94a3b8; line-height: 1.6; text-align: center; margin-bottom: 24px; }
  .otp-box { background: rgba(99,102,241,0.1); border: 2px solid rgba(99,102,241,0.3); border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
  .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #a78bfa; font-family: 'Courier New', monospace; }
  .otp-label { font-size: 13px; color: #64748b; margin-top: 8px; }
  .btn { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; }
  .divider { height: 1px; background: rgba(148,163,184,0.1); margin: 28px 0; }
  .footer { text-align: center; font-size: 12px; color: #64748b; margin-top: 24px; }
  .highlight { color: #a78bfa; font-weight: 600; }
  .info-row { display: flex; justify-content: space-between; padding: 10px 16px; background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 8px; font-size: 14px; }
  .info-label { color: #64748b; }
  .info-value { color: #f1f5f9; font-weight: 500; }
</style>
</head>
<body>
<div class="container">
  <div class="card">
    <div class="logo">
      <span class="logo-text">BixInsight<span class="logo-ai">AI</span></span>
    </div>
    ${content}
  </div>
  <div class="footer">
    © ${new Date().getFullYear()} BixInsight AI · AI-Powered Business Intelligence
  </div>
</div>
</body>
</html>`;
    }

    async sendWelcomeEmail(name, email) {
        const html = this._baseTemplate(`
    <div class="title">🎉 Welcome to BixInsight AI!</div>
    <div class="text">
      Congratulations <span class="highlight">${name}</span>! Your account has been created successfully.
      You now have access to AI-powered business intelligence at your fingertips.
    </div>
    <div class="divider"></div>
    <div class="text" style="font-size:14px;">
      <strong>Get started:</strong><br>
      📤 Upload your CSV data<br>
      🧹 AI will clean and analyze it<br>
      📊 Get interactive dashboards instantly<br>
      💬 Ask questions about your data
    </div>
    <div style="text-align:center; margin-top:24px;">
      <a href="https://bix-insight-ai.vercel.app/dashboard" class="btn">Go to Dashboard →</a>
    </div>
        `);
        return this.sendMail(email, '🎉 Welcome to BixInsight AI!', html);
    }

    async sendLoginNotification(name, email) {
        const now = new Date();
        const timeStr = now.toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: 'Asia/Kolkata'
        });
        const html = this._baseTemplate(`
    <div class="title">🔐 New Login Detected</div>
    <div class="text">
      Hi <span class="highlight">${name}</span>, a new login to your BixInsight AI account was detected.
    </div>
    <div class="info-row">
      <span class="info-label">Time</span>
      <span class="info-value">${timeStr}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Account</span>
      <span class="info-value">${email}</span>
    </div>
    <div class="divider"></div>
    <div class="text" style="font-size:13px;">
      If this wasn't you, please reset your password immediately.
    </div>
        `);
        return this.sendMail(email, '🔐 New Login Detected — BixInsight AI', html);
    }

    async sendOTPEmail(name, email, otp) {
        const html = this._baseTemplate(`
    <div class="title">🔑 Password Reset</div>
    <div class="text">
      Hi <span class="highlight">${name}</span>, use the code below to reset your password.
      This code expires in <strong>10 minutes</strong>.
    </div>
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
      <div class="otp-label">One-Time Password</div>
    </div>
    <div class="text" style="font-size:13px;">
      If you didn't request this, ignore this email — your password will remain unchanged.
    </div>
        `);
        return this.sendMail(email, `🔑 Password Reset OTP: ${otp}`, html);
    }
}

module.exports = new EmailService();
