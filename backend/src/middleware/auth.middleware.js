const jwt      = require('jsonwebtoken');
const { env }  = require('../config/env');
const { AppError } = require('./error.middleware');

const authMiddleware = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('Token de autorización no proporcionado', 401, 'NO_TOKEN'));
  }

  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, env.JWT_SECRET);
    next();
  } catch (err) {
    const code    = err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID';
    const message = err.name === 'TokenExpiredError' ? 'Sesión expirada, vuelva a iniciar sesión' : 'Token inválido';
    next(new AppError(message, 401, code));
  }
};

module.exports = { authMiddleware };
