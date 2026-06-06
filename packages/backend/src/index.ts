import express, { type Express } from 'express';
import { sequelize } from './config/sequelize.js';

export const app: Express = express();
const PORT = Number(process.env.PORT) || 3000;

sequelize.authenticate()
  .then(() => {
    console.log('Database connection established.');
    app.listen(PORT, () => {
      console.log(`Server listening on :${PORT}`);
    });
  })
  .catch((err: Error) => {
    console.error('Unable to connect to database:', err.message);
    process.exit(1);
  });
