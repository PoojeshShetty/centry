import { Router, type Request, type Response } from 'express';
import { ZodError } from 'zod';
import { logger } from '@centry/sdk';
import { AuthService, DuplicateEmailError, InvalidCredentialsError } from '../services/index.js';
import { AccountRepository } from '../repositories/index.js';
import { requireAuth } from '../middleware/requireAuth.js';

/** First Zod issue message, or a generic fallback. */
function zodMessage(err: ZodError): string {
  return err.issues[0]?.message ?? 'invalid input';
}

/** POST /api/auth/register — create an account and start a session (FR-01/02/03). */
export async function registerHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await AuthService.register(req.body);
    logger.info('Account registered: {accountId}', [result.user.id]);
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof DuplicateEmailError) {
      logger.warn('Registration failed: duplicate email');
      res.status(409).json({ error: err.message });
    } else if (err instanceof ZodError) {
      logger.warn('Registration validation failed: {error}', [zodMessage(err)]);
      res.status(400).json({ error: zodMessage(err) });
    } else {
      logger.error('Registration failed: {error}', [(err as Error).message], { 'error.stack': (err as Error).stack });
      throw err;
    }
  }
}

/** POST /api/auth/login — authenticate and start a session (FR-04/05). */
export async function loginHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await AuthService.login(req.body);
    logger.info('Account login successful');
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof InvalidCredentialsError) {
      logger.warn('Login failed: invalid credentials');
      res.status(401).json({ error: err.message });
    } else if (err instanceof ZodError) {
      logger.warn('Login validation failed: {error}', [zodMessage(err)]);
      res.status(400).json({ error: zodMessage(err) });
    } else {
      logger.error('Login failed: {error}', [(err as Error).message], { 'error.stack': (err as Error).stack });
      throw err;
    }
  }
}

/** GET /api/auth/me — return the signed-in account (FR-06). Never leaks `password_hash` (FR-08). */
export async function meHandler(req: Request, res: Response): Promise<void> {
  const account = await AccountRepository.findById(req.accountId!);
  if (!account) {
    logger.warn('GET /me: account not found for id {accountId}', [req.accountId]);
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  logger.info('GET /me: account {accountId}', [account.id]);
  res.status(200).json({
    id: account.id,
    name: account.name,
    email: account.email,
    created_at: account.created_at,
  });
}

export const authRouter: Router = Router();
authRouter.post('/register', registerHandler);
authRouter.post('/login', loginHandler);
authRouter.get('/me', requireAuth, meHandler);
