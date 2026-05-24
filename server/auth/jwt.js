import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'cross-culture-dev-secret-change-in-production';
const EXPIRES = process.env.JWT_EXPIRES || '30d';

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username },
    SECRET,
    { expiresIn: EXPIRES },
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}
