import { Router } from 'express';
import { SubmissionController } from '../controllers/SubmissionController.js';
import { uploadMiddleware } from '../middlewares/upload.js';
import { submissionRateLimiter } from '../middlewares/rateLimit.js';

const router = Router();

router.post(
  '/',
  submissionRateLimiter,
  uploadMiddleware,
  SubmissionController.create
);

export default router;
