import rateLimit from 'express-rate-limit';

export const submissionRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5, // Restaurado para 5 requisições por IP para bloquear ataques reais
  message: { error: 'Muitas requisições deste IP. Tente novamente em 1 minuto.' },
  standardHeaders: true,
  legacyHeaders: false,
});
