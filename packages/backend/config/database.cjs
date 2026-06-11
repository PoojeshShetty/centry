// sequelize-cli config. Reads the same DB env vars as src/config/sequelize.ts.
// Prefers a single DB_URL connection string; falls back to individual DB_* vars.
// Exported per-environment because sequelize-cli selects config[NODE_ENV || 'development'].

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

function buildConfig() {
  if (process.env.DB_URL) {
    return {
      url: process.env.DB_URL,
      dialect: 'postgres',
      logging: false,
    };
  }

  return {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dialect: 'postgres',
    logging: false,
  };
}

const config = buildConfig();

module.exports = {
  development: config,
  test: config,
  production: config,
};
