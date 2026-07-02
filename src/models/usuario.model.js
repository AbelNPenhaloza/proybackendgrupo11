const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Modelo Usuario, según el UML del proyecto.
// Roles posibles: CLIENTE, ADMINISTRADOR, RECEPCIONISTA, BARBERO.
const Usuario = sequelize.define('Usuario', {
  usuario_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El nombre no puede estar vacío' },
      len: { args: [2, 50], msg: 'El nombre debe tener entre 2 y 50 caracteres' },
    },
  },
  apellido: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El apellido no puede estar vacío' },
      len: { args: [2, 50], msg: 'El apellido debe tener entre 2 y 50 caracteres' },
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'El email no puede estar vacío' },
      isEmail: { msg: 'El email no tiene un formato válido' },
    },
  },
  password: {
    // Ojo: acá siempre va el HASH de la contraseña, nunca el texto plano.
    // El hasheo se hace en el controller con bcrypt antes de guardar, por
    // eso NO validamos "largo mínimo" aquí: un hash de bcrypt siempre mide
    // 60 caracteres, sin importar si el usuario puso una contraseña larga o
    // corta. La regla de "mínimo 6-8 caracteres" tiene que chequearse en el
    // controller, sobre el password que manda el usuario, ANTES de hashear.
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El password no puede estar vacío' },
    },
  },
  celular: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      // allowNull: true permite que sea NULL, pero si viene con un valor,
      // igual queremos que tenga un largo razonable (no "a" ni un texto gigante).
      len: { args: [0, 20], msg: 'El celular no puede tener más de 20 caracteres' },
    },
  },
  rol: {
    type: DataTypes.ENUM('CLIENTE', 'ADMINISTRADOR', 'RECEPCIONISTA', 'BARBERO'),
    allowNull: false,
    defaultValue: 'CLIENTE',
  },
  activo: {
    // Esto es distinto del soft-delete (paranoid). "activo" es un estado de
    // negocio: un admin puede desactivar temporalmente a un usuario (por
    // ejemplo, un barbero de licencia) sin borrarlo ni ocultarlo del todo.
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'usuarios',
  timestamps: true,   // agrega createdAt / updatedAt automáticamente
  paranoid: true,     // soft delete: al hacer destroy(), en vez de borrar la
                       // fila, Sequelize completa la columna deletedAt.
                       // Las consultas normales (findAll, findOne, etc.)
                       // ignoran automáticamente los registros "borrados".
});

module.exports = Usuario;