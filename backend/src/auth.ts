import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction, Router } from 'express';
import { z } from 'zod';
import type { AppContext } from './types.js';
import { asyncHandler, HttpError, parseBody } from './http.js';
import { toIsoDateTime } from './utils.js';

const cookieName = 'moneypulse_session';

const setupSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(8),
  email: z.string().email()
});

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1)
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8)
});

export function registerAuthRoutes(router: Router, context: AppContext): void {
  router.get('/auth/setup-status', (_req, res) => {
    res.json({ needsSetup: !hasUser(context) });
  });

  router.post(
    '/auth/setup',
    asyncHandler(async (req, res) => {
      if (hasUser(context)) {
        throw new HttpError(409, 'SETUP_ALREADY_DONE', 'Setup has already been completed');
      }

      const body = parseBody(setupSchema, req.body);
      const now = toIsoDateTime(context.now());
      const passwordHash = await bcrypt.hash(body.password, 10);
      const id = context.db.insert(
        `INSERT INTO users (username, password_hash, email, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [body.username, passwordHash, body.email, now, now]
      );
      const user = getPublicUser(context, id);
      setSessionCookie(res, context, id);
      res.status(201).json({ user });
    })
  );

  router.post(
    '/auth/login',
    asyncHandler(async (req, res) => {
      const body = parseBody(loginSchema, req.body);
      const user = context.db.get<{ id: number; username: string; password_hash: string; email: string }>(
        'SELECT id, username, password_hash, email FROM users WHERE username = ?',
        [body.username]
      );

      if (!user || !(await bcrypt.compare(body.password, user.password_hash))) {
        throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid username or password');
      }

      setSessionCookie(res, context, Number(user.id));
      res.json({ user: getPublicUser(context, Number(user.id)) });
    })
  );

  router.post('/auth/logout', (_req, res) => {
    res.clearCookie(cookieName, cookieOptions(context));
    res.status(204).end();
  });

  router.get('/auth/me', requireAuth(context), (req, res) => {
    res.json({ user: getPublicUser(context, Number(res.locals.userId)) });
  });

  router.put(
    '/auth/password',
    requireAuth(context),
    asyncHandler(async (req, res) => {
      const body = parseBody(passwordSchema, req.body);
      const user = context.db.get<{ id: number; password_hash: string }>(
        'SELECT id, password_hash FROM users WHERE id = ?',
        [Number(res.locals.userId)]
      );
      if (!user || !(await bcrypt.compare(body.currentPassword, user.password_hash))) {
        throw new HttpError(400, 'INVALID_PASSWORD', 'Current password is incorrect');
      }

      const passwordHash = await bcrypt.hash(body.newPassword, 10);
      context.db.run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [
        passwordHash,
        toIsoDateTime(context.now()),
        Number(user.id)
      ]);
      res.status(204).end();
    })
  );
}

export function requireAuth(context: AppContext) {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.[cookieName];
    if (!token) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }

    try {
      const payload = jwt.verify(token, context.jwtSecret) as { sub: string };
      res.locals.userId = Number(payload.sub);
      next();
    } catch {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid session' } });
    }
  };
}

function hasUser(context: AppContext): boolean {
  const row = context.db.get<{ count: number }>('SELECT COUNT(*) as count FROM users');
  return Number(row?.count ?? 0) > 0;
}

function getPublicUser(context: AppContext, id: number) {
  const user = context.db.get<{ id: number; username: string; email: string }>(
    'SELECT id, username, email FROM users WHERE id = ?',
    [id]
  );
  if (!user) {
    throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
  }
  return { id: Number(user.id), username: String(user.username), email: String(user.email) };
}

function setSessionCookie(res: Response, context: AppContext, userId: number): void {
  const token = jwt.sign({ sub: String(userId) }, context.jwtSecret, { expiresIn: '30d' });
  res.cookie(cookieName, token, {
    ...cookieOptions(context),
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
}

function cookieOptions(context: AppContext) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: context.cookieSecure,
    path: '/'
  };
}
