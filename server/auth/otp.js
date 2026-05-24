/**
 * 短信验证码：存于 platform-db，适配 Netlify Blobs / 文件 / Postgres
 */
import crypto from 'crypto';
import { runDbUpdate } from '../db/engine.js';
import { sendVerificationSms } from './sms.js';

const OTP_TTL_MS = 5 * 60 * 1000;
const SEND_COOLDOWN_MS = 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;

function hashCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

function generateCode() {
  return String(crypto.randomInt(100000, 999999));
}

function pruneOtps(db) {
  const now = Date.now();
  db.otpRecords = (db.otpRecords || []).filter((r) => new Date(r.expiresAt).getTime() > now - 60000);
}

export async function sendOtp({ phone, purpose }) {
  return runDbUpdate(async (db) => {
    pruneOtps(db);
    db.otpRecords = db.otpRecords || [];

    const last = db.otpRecords
      .filter((r) => r.phone === phone && r.purpose === purpose)
      .sort((a, b) => (b.sentAt || '').localeCompare(a.sentAt || ''))[0];

    if (last && Date.now() - new Date(last.sentAt).getTime() < SEND_COOLDOWN_MS) {
      const wait = Math.ceil((SEND_COOLDOWN_MS - (Date.now() - new Date(last.sentAt).getTime())) / 1000);
      throw new Error(`发送过于频繁，请 ${wait} 秒后再试`);
    }

    const code = generateCode();
    const sentAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

    db.otpRecords.push({
      id: crypto.randomUUID(),
      phone,
      purpose,
      codeHash: hashCode(code),
      attempts: 0,
      sentAt,
      expiresAt,
    });

    const smsResult = await sendVerificationSms(phone, code);
    return {
      expiresInSec: Math.floor(OTP_TTL_MS / 1000),
      mockCode: smsResult.mockCode,
    };
  });
}

export async function verifyOtp({ phone, purpose, code }) {
  return runDbUpdate((db) => {
    pruneOtps(db);
    const now = Date.now();
    const record = (db.otpRecords || [])
      .filter((r) => r.phone === phone && r.purpose === purpose)
      .sort((a, b) => (b.sentAt || '').localeCompare(a.sentAt || ''))[0];

    if (!record) {
      throw new Error('验证码无效或已过期，请重新获取');
    }

    if (new Date(record.expiresAt).getTime() < now) {
      throw new Error('验证码已过期，请重新获取');
    }

    record.attempts = (record.attempts || 0) + 1;
    if (record.attempts > MAX_VERIFY_ATTEMPTS) {
      throw new Error('验证码错误次数过多，请重新获取');
    }

    if (hashCode(code) !== record.codeHash) {
      throw new Error('验证码错误');
    }

    db.otpRecords = (db.otpRecords || []).filter((r) => r.id !== record.id);
    return true;
  });
}
