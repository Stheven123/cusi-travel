const { AppError } = require('./error.middleware');

// Grupos de permisos predefinidos (basados en rol_usuario del DDL)
const ROLES = {
  ALL:        ['ADMIN', 'OPERACIONES', 'VENTAS', 'GUIA', 'FINANZAS', 'SOLO_LECTURA'],
  OPERATORS:  ['ADMIN', 'OPERACIONES', 'VENTAS'],
  MANAGEMENT: ['ADMIN', 'OPERACIONES', 'FINANZAS'],
  ADMIN_ONLY: ['ADMIN'],
};

/**
 * Factory de middleware RBAC.
 * Uso: requireRoles('ADMIN', 'OPERACIONES')
 *  o:  requireRoles(...ROLES.OPERATORS)
 */
const requireRoles = (...roles) => (req, _res, next) => {
  if (!req.user) {
    return next(new AppError('No autenticado', 401, 'UNAUTHENTICATED'));
  }
  if (!roles.includes(req.user.rol)) {
    return next(new AppError(
      `Acción no permitida para el rol ${req.user.rol}`,
      403,
      'FORBIDDEN'
    ));
  }
  next();
};

module.exports = { requireRoles, ROLES };
