const jwt = require('jsonwebtoken');

// Este middleware se pone en cualquier ruta que requiera estar logueado.
// Lee el token del header "Authorization: Bearer <token>", lo valida,
// y si es correcto, guarda los datos del usuario en req.usuario para que
// el resto de la petición (controller, otros middlewares) los pueda usar.
function verificarToken(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = header.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload; // { usuario_id, rol }
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = verificarToken;