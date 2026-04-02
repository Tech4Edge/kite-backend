import jwt from 'jsonwebtoken';

export function requireAdminAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Missing authorization token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET || 'change-me');
    req.admin = { email: decoded.email };
    next();
  } catch (err) {
    console.error('Invalid admin token', err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

