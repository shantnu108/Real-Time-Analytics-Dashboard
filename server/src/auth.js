const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || 'dev-secret';

// verify a token
function verifyToken(token) {
  return jwt.verify(token, secret);
}

// middleware for REST endpoints
function expressAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).send({ error: 'Missing Authorization header' });
  const token = auth.split(' ')[1];
  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    return res.status(401).send({ error: 'Invalid token' });
  }
}

module.exports = { expressAuth, verifyToken, secret };
