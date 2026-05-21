import { Router } from 'express';
import { FormController } from '../controllers/FormController.js';
import { SubmissionController } from '../controllers/SubmissionController.js';
import { EvaluationController } from '../controllers/EvaluationController.js';
import { authMiddleware } from '../middlewares/auth.js';
import { uploadMiddleware } from '../middlewares/upload.js';
import { submissionRateLimiter } from '../middlewares/rateLimit.js';

const router = Router();

// Apenas ADMINs podem criar e abrir/fechar forms
router.post('/', authMiddleware(['ADMIN']), FormController.create);
router.patch('/:id/toggle', authMiddleware(['ADMIN']), FormController.toggle);

// Submissão na rota que o Frontend quer: /api/forms/:slug/submissions
router.post('/:slug/submissions', submissionRateLimiter, uploadMiddleware, SubmissionController.create);

// Listar Projetos Aprovados do Form (Com QR Codes dinâmicos)
router.get('/:slug/submissions', authMiddleware(), SubmissionController.listByForm);

// Progresso de Votos do Avaliador
router.get('/:slug/voting-progress', authMiddleware(), EvaluationController.getVotingProgress);
router.get('/:slug/voting-report', authMiddleware(['ADMIN']), EvaluationController.getVotingReport);

// Qualquer um pode listar (público) para o frontend verificar se está aberto
router.get('/', FormController.list);

export default router;
