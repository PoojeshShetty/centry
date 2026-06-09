import { Router, type Request, type Response } from 'express';
import { ZodError } from 'zod';
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
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof DuplicateEmailError) {
      res.status(409).json({ error: err.message });
    } else if (err instanceof ZodError) {
      res.status(400).json({ error: zodMessage(err) });
    } else {
      throw err;
    }
  }
}

/** POST /api/auth/login — authenticate and start a session (FR-04/05). */
export async function loginHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await AuthService.login(req.body);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof InvalidCredentialsError) {
      res.status(401).json({ error: err.message });
    } else if (err instanceof ZodError) {
      res.status(400).json({ error: zodMessage(err) });
    } else {
      throw err;
    }
  }
}

/** GET /api/auth/me — return the signed-in account (FR-06). Never leaks `password_hash` (FR-08). */
export async function meHandler(req: Request, res: Response): Promise<void> {
  const account = await AccountRepository.findById(req.accountId!);
  if (!account) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
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
