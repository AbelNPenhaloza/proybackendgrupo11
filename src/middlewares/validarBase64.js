const { MAX_BASE64_LENGTH } = require('../utils/constantes');

// Middleware reutilizable: valida el campo foto_url del body, si vino.
// No es obligatorio mandar foto (allowNull: true en los modelos), pero SI
// viene, no puede superar el límite.
function validarBase64(req, res, next) {
  const { foto_url } = req.body;

  if (foto_url && foto_url.length > MAX_BASE64_LENGTH) {
    return res.status(400).json({
      error: `La imagen es demasiado grande. Máximo permitido: 2MB.`,
    });
  }

  next();
}

module.exports = validarBase64;