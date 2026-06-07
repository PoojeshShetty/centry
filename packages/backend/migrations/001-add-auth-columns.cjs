'use strict';

// Adds the auth columns to the existing `accounts` table:
//   - email         VARCHAR NOT NULL, with a unique index (login identity, FR-01/FR-02)
//   - password_hash VARCHAR NOT NULL (bcryptjs hash, never returned to clients, FR-08)
// Assumes an empty/dev `accounts` table (NOT NULL added without backfill). Reversible.

const EMAIL_UNIQUE_INDEX = 'accounts_email_unique_idx';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'accounts',
        'email',
        { type: Sequelize.STRING, allowNull: false },
        { transaction },
      );
      await queryInterface.addColumn(
        'accounts',
        'password_hash',
        { type: Sequelize.STRING, allowNull: false },
        { transaction },
      );
      await queryInterface.addIndex('accounts', ['email'], {
        name: EMAIL_UNIQUE_INDEX,
        unique: true,
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('accounts', EMAIL_UNIQUE_INDEX, { transaction });
      await queryInterface.removeColumn('accounts', 'password_hash', { transaction });
      await queryInterface.removeColumn('accounts', 'email', { transaction });
    });
  },
};
