import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import formRoutes from './routes/form.routes.js';
import submissionRoutes from './routes/submission.routes.js';
import evaluationRoutes from './routes/evaluation.routes.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/forms', formRoutes);
// A submissão agora estará dentro de forms.routes
app.use('/api/evaluations', evaluationRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

export default app;
