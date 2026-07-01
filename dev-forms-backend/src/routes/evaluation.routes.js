import { Router } from 'express';
import { EvaluationController } from '../controllers/EvaluationController.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

// Agora QUALQUER usuário logado (ADMIN, JUDGE ou DEV) pode avaliar!
// O peso da nota será calculado pelo backend (JUDGE=3, DEV=1)
router.post('/', authMiddleware(), EvaluationController.evaluate);

// Qualquer logado (ou até publico, dependendo da regra) pode ver o ranking
router.get('/ranking/:formId', authMiddleware(), EvaluationController.ranking);

// Envio de e-mail de notificação aos vencedores (Apenas ADMIN)
router.post('/send-winner-email', authMiddleware(['ADMIN']), EvaluationController.sendWinnerEmail);

// Envio de e-mail de teste dos finalistas (Apenas ADMIN)
router.post('/send-test-winner-email', authMiddleware(['ADMIN']), EvaluationController.sendTestWinnerEmail);

export default router;
