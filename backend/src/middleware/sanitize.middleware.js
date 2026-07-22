const sanitizeHtml = require('sanitize-html');

// Configuración estricta: elimina TODO HTML y codifica entidades.
// Protege específicamente campos como restricciones_alimenticias y observaciones.
const SANITIZE_OPTS = {
  allowedTags:        [],   // cero tags permitidos
  allowedAttributes:  {},
  disallowedTagsMode: 'recursiveEscape',
};

const cleanString = (val) => {
  if (typeof val !== 'string') return val;
  return sanitizeHtml(val, SANITIZE_OPTS).trim();
};

// Recorre recursivamente un objeto/array y limpia todos los strings
const sanitizeDeep = (input) => {
  if (input === null || input === undefined) return input;
  if (typeof input === 'string')  return cleanString(input);
  if (Array.isArray(input))       return input.map(sanitizeDeep);
  if (typeof input === 'object') {
    const out = {};
    for (const key of Object.keys(input)) {
      out[key] = sanitizeDeep(input[key]);
    }
    return out;
  }
  return input; // números, booleanos — sin cambios
};

const sanitizeMiddleware = (req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeDeep(req.body);
  }
  next();
};

module.exports = { sanitizeMiddleware, cleanString };
