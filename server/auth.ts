import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from './db.js';

interface AdminSession {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  expiresAt: number;
}

// In-memory active session store (backed by token map with expiration)
const activeSessions = new Map<string, AdminSession>();

// Rate limiter for login: IP -> { attempts: number, lockUntil: number }
const loginRateLimit = new Map<string, { attempts: number; lockUntil: number }>();

export function checkLoginRateLimit(ip: string): { allowed: boolean; remainingSeconds?: number } {
  const now = Date.now();
  const record = loginRateLimit.get(ip);
  if (!record) return { allowed: true };

  if (record.lockUntil > now) {
    return { allowed: false, remainingSeconds: Math.ceil((record.lockUntil - now) / 1000) };
  }

  // Lock expired, reset
  if (record.lockUntil > 0 && record.lockUntil <= now) {
    loginRateLimit.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordFailedLogin(ip: string) {
  const now = Date.now();
  const record = loginRateLimit.get(ip) || { attempts: 0, lockUntil: 0 };
  record.attempts += 1;
  if (record.attempts >= 5) {
    record.lockUntil = now + 15 * 60 * 1000; // 15 min lockout
  }
  loginRateLimit.set(ip, record);
}

export function resetLoginAttempts(ip: string) {
  loginRateLimit.delete(ip);
}

export function createSession(userId: string, email: string, fullName: string, role: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
  activeSessions.set(token, {
    userId,
    email,
    fullName,
    role,
    expiresAt: Date.now() + sessionDuration,
  });
  return token;
}

export function destroySession(token: string) {
  activeSessions.delete(token);
}

export interface AuthenticatedRequest extends Request {
  user?: AdminSession;
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.admin_session || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
    return;
  }

  const session = activeSessions.get(token);
  if (!session) {
    res.status(401).json({ error: 'Session invalid or expired. Please log in again.' });
    return;
  }

  if (session.expiresAt < Date.now()) {
    activeSessions.delete(token);
    res.status(401).json({ error: 'Session expired. Please log in again.' });
    return;
  }

  req.user = session;
  next();
}

export async function logAdminAction(
  adminEmail: string,
  action: string,
  targetType: string,
  targetId: string | null,
  details: string | null,
  ip: string
) {
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO admin_audit_logs (id, admin_email, action, target_type, target_id, details, ip_address, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [`audit_${crypto.randomUUID()}`, adminEmail, action, targetType, targetId, details, ip, now],
  });
}
