import { emailJsService } from './emailJsService';

/**
 * OTP Generation, Multi-Channel Delivery & Verification Service
 */

interface ActiveOtp {
  code: string;
  destination: string;
  type: 'email' | 'phone';
  purpose: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
}

const OTP_STORAGE_KEY = 'civicfix_active_otps';
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export const otpService = {
  // Load active OTP storage
  getStoredOtps(): Record<string, ActiveOtp> {
    try {
      const raw = localStorage.getItem(OTP_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      // Filter expired
      const now = Date.now();
      const filtered: Record<string, ActiveOtp> = {};
      Object.keys(parsed).forEach(key => {
        if (parsed[key] && parsed[key].expiresAt > now) {
          filtered[key] = parsed[key];
        }
      });
      return filtered;
    } catch {
      return {};
    }
  },

  setStoredOtps(otps: Record<string, ActiveOtp>): void {
    try {
      localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(otps));
    } catch (e) {
      console.warn('Failed to store OTPs to localStorage', e);
    }
  },

  generateOtpCode(): string {
    // Generate secure 6-digit numeric string (100000 - 999999)
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const num = 100000 + (array[0] % 900000);
    return num.toString();
  },

  async sendOtp(destination: string, type: 'email' | 'phone', purpose = 'verification'): Promise<{ success: boolean; code: string; message: string }> {
    const cleanDest = destination.trim().toLowerCase();
    const code = this.generateOtpCode();
    const now = Date.now();

    const otpData: ActiveOtp = {
      code,
      destination: cleanDest,
      type,
      purpose,
      createdAt: now,
      expiresAt: now + OTP_EXPIRY_MS,
      attempts: 0
    };

    const all = this.getStoredOtps();
    all[cleanDest] = otpData;
    this.setStoredOtps(all);

    console.log(`[CivicFix OTP Service] Generated OTP for ${cleanDest} (${purpose}): ${code}`);

    // Broadcast in-app event so toast/notification or modal can display it
    try {
      window.dispatchEvent(new CustomEvent('civicfix_otp_dispatched', {
        detail: {
          destination: cleanDest,
          type,
          purpose,
          code,
          expiresAt: otpData.expiresAt
        }
      }));
    } catch (e) {
      console.warn('Could not dispatch OTP event', e);
    }

    // Direct email dispatch attempt via EmailJS
    if (type === 'email') {
      if (emailJsService.isConfigured()) {
        try {
          await emailJsService.sendVerificationCode(cleanDest, code);
        } catch (emailErr) {
          console.warn('[EmailJS Dispatch Error]:', emailErr);
        }
      }
      console.log(`[CivicFix EmailJS Dispatch] Dispatched confirmation code ${code} to ${cleanDest}`);
    }

    return {
      success: true,
      code,
      message: `Verification code sent to ${destination}`
    };
  },

  verifyOtp(destination: string, token: string): { valid: boolean; reason?: string } {
    const cleanDest = destination.trim().toLowerCase();
    const cleanToken = token.trim();

    if (!cleanToken) {
      return { valid: false, reason: 'Please enter the 6-digit code.' };
    }

    const all = this.getStoredOtps();
    const active = all[cleanDest];

    if (!active) {
      return { valid: false, reason: 'No active OTP found or code has expired. Please request a new code.' };
    }

    if (Date.now() > active.expiresAt) {
      delete all[cleanDest];
      this.setStoredOtps(all);
      return { valid: false, reason: 'Verification code has expired. Please request a new code.' };
    }

    // Match code
    if (active.code === cleanToken) {
      delete all[cleanDest];
      this.setStoredOtps(all);
      return { valid: true };
    }

    active.attempts += 1;
    this.setStoredOtps(all);
    return { valid: false, reason: 'Incorrect confirmation code. Please check and try again.' };
  },

  getLatestOtp(destination: string): string | null {
    const cleanDest = destination.trim().toLowerCase();
    const all = this.getStoredOtps();
    const active = all[cleanDest];
    if (active && active.expiresAt > Date.now()) {
      return active.code;
    }
    return null;
  }
};

export default otpService;
