import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { AccountRepository } from '../repositories/index.js';
import type { Account } from '../models/account.js';

/** Public account shape — never includes `password_hash` (FR-08). */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  created_at: Date;
}

export interface AuthResult {
  token: string;
  user: PublicUser;
}

/** Thrown when registering an email that already exists (mapped to 409). */
export class DuplicateEmailError extends Error {
  constructor() {
    super('email already registered');
    this.name = 'DuplicateEmailError';
  }
}

/** Thrown for unknown email OR wrong password — single generic message (mapped to 401). */
export class InvalidCredentialsError extends Error {
  constructor() {
    super('invalid email or password');
    this.name = 'InvalidCredentialsError';
  }
}

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

const BCRYPT_ROUNDS = 10;
const TOKEN_TTL = '1h';

function signToken(accountId: string): string {
  const secret = process.env.JWT_SECRET ?? 'dev-secret';
  return jwt.sign({ sub: accountId }, secret, { expiresIn: TOKEN_TTL });
}

function toPublicUser(account: Account): PublicUser {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    created_at: account.created_at,
  };
}

export const AuthService = {
  /** Validate, hash, persist, and sign a session for a new account. */
  async register(input: RegisterInput): Promise<AuthResult> {
    const { name, email, password } = registerSchema.parse(input);
    const normalizedEmail = email.toLowerCase();

    const existing = await AccountRepository.findByEmail(normalizedEmail);
    if (existing) throw new DuplicateEmailError();

    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const account = await AccountRepository.create({
      name,
      email: normalizedEmail,
      password_hash,
    });

    return { token: signToken(account.id), user: toPublicUser(account) };
  },

  /** Verify credentials (case-insensitive email) and sign a session. */
  async login(input: LoginInput): Promise<AuthResult> {
    const { email, password } = loginSchema.parse(input);

    const account = await AccountRepository.findByEmail(email.toLowerCase());
    if (!account) throw new InvalidCredentialsError();

    const ok = await bcrypt.compare(password, account.password_hash);
    if (!ok) throw new InvalidCredentialsError();

    return { token: signToken(account.id), user: toPublicUser(account) };
  },
};
