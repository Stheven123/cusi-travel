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

// Los campos de contraseña NUNCA deben pasar por el sanitizador de HTML: si el
// usuario elige una contraseña con &lt;, &gt; o & el HTML-escape la altera antes
// de hashearla, y el valor almacenado ya no coincide con lo que el usuario
// escribió (rompe el login y reduce la entropía efectiva de la contraseña).
const PASSWORD_KEYS = new Set(['password', 'nueva_password', 'password_actual', 'confirmar_password']);

// Recorre recursivamente un objeto/array y limpia todos los strings
const sanitizeDeep = (input) => {
  if (input === null || input === undefined) return input;
  if (typeof input === 'string')  return cleanString(input);
  if (Array.isArray(input))       return input.map(sanitizeDeep);
  if (typeof input === 'object') {
    const out = {};
    for (const key of Object.keys(input)) {
      out[key] = PASSWORD_KEYS.has(key) ? input[key] : sanitizeDeep(input[key]);
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
