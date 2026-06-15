import { init, logger, traceMiddleware } from '@centry/sdk';
import express, { type Express } from 'express';
import cors from 'cors';
import { sequelize } from './config/sequelize.js';
import { authRouter, projectRouter } from './routes/index.js';

init({
  dsn: 'https://17f0b472b515c0881e3c49dcab9d7866286af05f4143dd62f6d5e5e163511c83@localhost:3000/af87ae07-31cd-435f-b2e1-17c8459a0359',
  enableLogs: true,
});

export const app: Express = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());
app.use(traceMiddleware);
app.use('/api/auth', authRouter);
app.use('/api/projects', projectRouter);

sequelize.authenticate()
  .then(() => {
    logger.info('Database connection established.');
    app.listen(PORT, () => {
      logger.info('Server listening on :{port}', [PORT]);
    });
  })
  .catch((err: Error) => {
    logger.error('Unable to connect to database: {message}', [err.message]);
    process.exit(1);
  });
