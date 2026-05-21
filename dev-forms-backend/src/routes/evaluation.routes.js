import { Router } from 'express';
import { EvaluationController } from '../controllers/EvaluationController.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

// Agora QUALQUER usuário logado (ADMIN, JUDGE ou DEV) pode avaliar!
// O peso da nota será calculado pelo backend (JUDGE=3, DEV=1)
router.post('/', authMiddleware(), EvaluationController.evaluate);

// Qualquer logado (ou até publico, dependendo da regra) pode ver o ranking
router.get('/ranking/:formId', authMiddleware(), EvaluationController.ranking);

export default router;
