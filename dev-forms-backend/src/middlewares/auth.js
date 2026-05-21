import jwt from 'jsonwebtoken';

export const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Token is missing' });

    const [, token] = authHeader.split(' ');

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      req.user = decoded; // { id, role }

      if (roles.length > 0 && !roles.includes(decoded.role)) {
        return res.status(403).json({ error: 'Forbidden. You do not have the necessary role.' });
      }

      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Token invalid or expired' });
    }
  };
};
