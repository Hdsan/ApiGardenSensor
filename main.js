import express from 'express';
import dotenv from 'dotenv';
import apiRoutes from './src/interfaces/http/routes/apiRoutes.js';
import ApplicationError from './src/shared/errors/ApplicationError.js';

const app = express();
dotenv.config();

app.use(express.json());
app.use('', apiRoutes);

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err instanceof ApplicationError ? err.statusCode : err.statusCode || 500;
  const message = err instanceof ApplicationError ? err.message : 'Erro interno do servidor';

  console.error(err);
  return res.status(statusCode).json({ error: message });
});

const host = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || 3333;

app.listen(port, host, () => {
  console.log(`Servidor rodando em ${host}:${port}`);
});
