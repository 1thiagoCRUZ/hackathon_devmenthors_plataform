import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Rotas exclusivas de administração de usuários
router.get('/users', authMiddleware(['ADMIN']), AuthController.listUsers);
router.post('/users', authMiddleware(['ADMIN']), AuthController.createUser);
router.post('/users/:id/send-email', authMiddleware(['ADMIN']), AuthController.sendCredentialsEmail);

export default router;

