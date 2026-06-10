import { Account } from '../models/account.js';

/** Fields required to persist a new account. `email` must already be lowercased by the caller. */
export interface CreateAccountInput {
  name: string;
  email: string;
  password_hash: string;
}

/** Sequelize data access for the `accounts` table. */
export const AccountRepository = {
  /** Persist a new account and return the created instance. */
  create(input: CreateAccountInput): Promise<Account> {
    return Account.create(input);
  },

  /** Look up an account by its (lowercased) email; null when none exists. */
  findByEmail(email: string): Promise<Account | null> {
    return Account.findOne({ where: { email } });
  },

  /** Look up an account by primary key; null when none exists. */
  findById(id: string): Promise<Account | null> {
    return Account.findByPk(id);
  },
};
