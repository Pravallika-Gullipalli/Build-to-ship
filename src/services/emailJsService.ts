import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

if (PUBLIC_KEY) {
  try {
    emailjs.init({ publicKey: PUBLIC_KEY });
  } catch (e) {
    console.warn('[EmailJS] init error:', e);
  }
}

export const emailJsService = {
  isConfigured(): boolean {
    return Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);
  },

  async sendVerificationCode(toEmail: string, code: string, recipientName = ''): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured()) {
      console.warn('[EmailJS] Configuration missing (SERVICE_ID, TEMPLATE_ID, or PUBLIC_KEY not set in .env)');
      return { success: false, message: 'EmailJS credentials missing in .env' };
    }

    const cleanEmail = toEmail.trim().toLowerCase();
    const finalName = recipientName || cleanEmail.split('@')[0];

    const templateParams = {
      to_email: cleanEmail,
      email: cleanEmail,
      reply_to: cleanEmail,
      recipient_email: cleanEmail,
      user_email: cleanEmail,
      to_name: finalName,
      user_name: finalName,
      name: finalName,
      passcode: code,
      otp_code: code,
      otp: code,
      code: code,
      token: code,
      verification_code: code,
      message: `Your 6-digit verification code is: ${code}`,
      app_name: 'AI CivicFix',
      time: new Date().toLocaleTimeString()
    };

    try {
      emailjs.init({ publicKey: PUBLIC_KEY });
      const response = await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        templateParams,
        PUBLIC_KEY
      );

      console.log(`[EmailJS] Successfully dispatched OTP email to ${cleanEmail}:`, response.status, response.text);
      return { success: true, message: 'Verification email sent successfully.' };
    } catch (error: any) {
      console.error('[EmailJS] Failed to send email:', error);
      const errDetail = error?.text || error?.message || JSON.stringify(error);
      return { success: false, message: `EmailJS error: ${errDetail}` };
    }
  }
};

export default emailJsService;
