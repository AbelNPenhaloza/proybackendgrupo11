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
    // Si Sequelize tira un error de validación (ej: email mal formado por
    // el validate: isEmail del modelo), lo mandamos como 400.
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

    // Mensaje genérico a propósito: no le decimos al que intenta loguearse
    // si el problema fue el email o el password, por seguridad.
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
// A diferencia de register(), acá el rol SÍ viene del body, porque quien
// llama ya es un Admin y decide qué tipo de usuario está creando.
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
// Usa el usuario_id que viene del token (req.usuario), NUNCA un :id de la
// URL -- así nadie puede pedir el perfil de otra persona cambiando un id.
async function perfil(req, res) {
  try {
    const usuario = await Usuario.findByPk(req.usuario.usuario_id, {
      attributes: { exclude: ['password'] }, // nunca devolver el hash
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
// Endpoint especial, solo para crear el PRIMER administrador del sistema.
// No usa JWT (todavía no existe ningún admin para generarlo) sino una
// clave secreta que solo el equipo conoce. Se autodeshabilita una vez que
// ya existe un admin.
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

module.exports = {
  register,
  login,
  crearUsuarioConRol,
  perfil,
  seedAdmin,
};