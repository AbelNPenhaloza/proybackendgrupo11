const jwt = require('jsonwebtoken');

// Genera el token que se manda al cliente después de un login exitoso.
// Adentro del token viaja el id del usuario y su rol, así los middlewares
// de autorización pueden chequear permisos sin volver a consultar la base.
function generarToken(usuario) {
  const payload = {
    usuario_id: usuario.usuario_id,
    rol: usuario.rol,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });
}

module.exports = { generarToken };