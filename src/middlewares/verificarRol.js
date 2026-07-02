// Middleware "factory": lo llamás con los roles que están permitidos y te
// devuelve el middleware real. Se usa siempre DESPUÉS de verificarToken,
// porque necesita que req.usuario ya exista.
//
// Ejemplo de uso en una ruta:
//   router.post('/usuarios', verificarToken, verificarRol('ADMINISTRADOR'), ctrl.crearUsuarioConRol);
function verificarRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      // Esto no debería pasar si siempre se usa después de verificarToken,
      // pero lo chequeamos igual por si alguien lo usa mal en una ruta.
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ error: 'No tenés permisos para esta acción' });
    }

    next();
  };
}

module.exports = verificarRol;