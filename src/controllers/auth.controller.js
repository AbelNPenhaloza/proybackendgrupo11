const bcrypt = require('bcryptjs');
const { Usuario } = require('../models');
const { generarToken } = require('../utils/jwt.util');
const { registrarAuditoria } = require('../services/auditoria.service');

// Cuántas "vueltas" de hasheo hace bcrypt. 10 es un valor estándar,
// suficiente para un proyecto de la materia (más alto = más seguro pero
// más lento).
const SALT_ROUNDS = 10;

// POST /api/auth/register
// Registro público. El rol queda SIEMPRE en CLIENTE, sin importar qué
// venga en el body -- así evitamos que cualquiera se registre como Admin.
async function register(req, res) {
  try {
    const { nombre, apellido, email, password, celular } = req.body;

    if (!nombre || !apellido || !email || !password) {
      return res.status(400).json({ error: 'Faltan campos obligatorios (nombre, apellido, email, password)' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'El password debe tener al menos 6 caracteres' });
    }

    const yaExiste = await Usuario.findOne({ where: { email } });
    if (yaExiste) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese email' });
    }

    const passwordHasheado = await bcrypt.hash(password, SALT_ROUNDS);

    const nuevoUsuario = await Usuario.create({
      nombre,
      apellido,
      email,
      celular,
      password: passwordHasheado,
      rol: 'CLIENTE', // fijo, no se toma del body a propósito
    });

    // No devolvemos el password (ni siquiera el hash) en la respuesta.
    res.status(201).json({
      usuario_id: nuevoUsuario.usuario_id,
      nombre: nuevoUsuario.nombre,
      apellido: nuevoUsuario.apellido,
      email: nuevoUsuario.email,
      rol: nuevoUsuario.rol,
    });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password son obligatorios' });
    }

    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const passwordCorrecto = await bcrypt.compare(password, usuario.password);
    if (!passwordCorrecto) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (!usuario.activo) {
      return res.status(403).json({ error: 'Usuario inactivo, contactate con un administrador' });
    }

    const token = generarToken(usuario);

    await registrarAuditoria({
      usuario_id: usuario.usuario_id,
      accion: 'LOGIN_EXITOSO',
      descripcion: `Login exitoso de ${usuario.email}`,
      ip_origen: req.ip,
    });

    res.status(200).json({
      token,
      usuario: {
        usuario_id: usuario.usuario_id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
}

// POST /api/auth/usuarios
// Protegida con verificarToken + verificarRol('ADMINISTRADOR') en las rutas.
async function crearUsuarioConRol(req, res) {
  try {
    const { nombre, apellido, email, password, celular, rol } = req.body;

    const rolesValidos = ['ADMINISTRADOR', 'RECEPCIONISTA', 'BARBERO', 'CLIENTE'];
    if (!rol || !rolesValidos.includes(rol)) {
      return res.status(400).json({ error: `El rol debe ser uno de: ${rolesValidos.join(', ')}` });
    }

    if (!nombre || !apellido || !email || !password) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'El password debe tener al menos 6 caracteres' });
    }

    const yaExiste = await Usuario.findOne({ where: { email } });
    if (yaExiste) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese email' });
    }

    const passwordHasheado = await bcrypt.hash(password, SALT_ROUNDS);

    const nuevoUsuario = await Usuario.create({
      nombre,
      apellido,
      email,
      celular,
      password: passwordHasheado,
      rol,
    });

    res.status(201).json({
      usuario_id: nuevoUsuario.usuario_id,
      nombre: nuevoUsuario.nombre,
      apellido: nuevoUsuario.apellido,
      email: nuevoUsuario.email,
      rol: nuevoUsuario.rol,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
}

// GET /api/auth/perfil
// Usa el usuario_id que viene del token (req.usuario).
async function perfil(req, res) {
  try {
    const usuario = await Usuario.findByPk(req.usuario.usuario_id, {
      attributes: { exclude: ['password'] },
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.status(200).json(usuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el perfil' });
  }
}

// POST /api/auth/seed-admin
// Solo para crear el PRIMER administrador del sistema.
async function seedAdmin(req, res) {
  try {
    const claveRecibida = req.headers['x-seed-secret'];
    if (claveRecibida !== process.env.SEED_SECRET) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const yaHayAdmin = await Usuario.findOne({ where: { rol: 'ADMINISTRADOR' } });
    if (yaHayAdmin) {
      return res.status(409).json({ error: 'Ya existe un administrador, usá el login normal' });
    }

    const { nombre, apellido, email, password, celular } = req.body;
    if (!nombre || !apellido || !email || !password) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'El password debe tener al menos 6 caracteres' });
    }

    const passwordHasheado = await bcrypt.hash(password, SALT_ROUNDS);

    const admin = await Usuario.create({
      nombre,
      apellido,
      email,
      celular,
      password: passwordHasheado,
      rol: 'ADMINISTRADOR',
    });

    res.status(201).json({ mensaje: 'Administrador creado correctamente', usuario_id: admin.usuario_id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el administrador inicial' });
  }
}

// PUT /api/auth/perfil
async function actualizarPerfil(req, res) {
    try {
        const { nombre, apellido, celular } = req.body;
        const usuario = await Usuario.findByPk(req.usuario.usuario_id);

        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        usuario.nombre = nombre ?? usuario.nombre;
        usuario.apellido = apellido ?? usuario.apellido;
        usuario.celular = celular ?? usuario.celular;

        await usuario.save();

        res.status(200).json({
            mensaje: 'Perfil actualizado correctamente',
            usuario: {
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                email: usuario.email,
                celular: usuario.celular
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar el perfil' });
    }
}

// POST /api/auth/logout
async function logout(req, res) {
    try {
        await registrarAuditoria({
            usuario_id: req.usuario.usuario_id,
            accion: 'LOGOUT', 
            descripcion: `Logout exitoso de ${req.usuario.email}`,
            ip_origen: req.ip,
        });

        res.status(200).json({ mensaje: 'Sesión cerrada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al procesar el cierre de sesión' });
    }
}

// DELETE /api/auth/usuarios/:id
async function eliminarUsuario(req, res) {
    try {
        const { id } = req.params;
        const usuario = await Usuario.findByPk(id);
        
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        if (usuario.usuario_id === req.usuario.usuario_id) {
            return res.status(403).json({ error: 'No podés eliminar tu propia cuenta de administrador' });
        }

        await usuario.destroy(); 
        
        res.status(200).json({ mensaje: 'Usuario eliminado del sistema' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar el usuario' });
    }
}

// POST /api/auth/usuarios/:id/restaurar
async function restaurarUsuario(req, res) {
    try {
        const { id } = req.params;
        
        const usuario = await Usuario.findByPk(id, { paranoid: false });
        
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado en la papelera' });
        }

        if (!usuario.deletedAt) {
            return res.status(400).json({ error: 'El usuario no estaba eliminado' });
        }

        await usuario.restore();
        
        res.status(200).json({ mensaje: 'Usuario restaurado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al restaurar el usuario' });
    }
}

module.exports = {
  register,
  login,
  crearUsuarioConRol,
  perfil,
  seedAdmin,
  actualizarPerfil,
  logout,
  eliminarUsuario,
  restaurarUsuario
};