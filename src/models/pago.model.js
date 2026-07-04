const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Pago = sequelize.define('Pago', {
    pago_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    turno_id: { // Agregado conforme al UML
        type: DataTypes.UUID,
        allowNull: false
    },
    monto_total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    metodo_pago: {
        type: DataTypes.ENUM('TARJETA', 'EFECTIVO', 'TRANSFERENCIA', 'QR'),
        allowNull: false,
    },
    mp_preferencia_id: { 
        type: DataTypes.STRING,
        allowNull: true
    },
    estado_pago: {
        type: DataTypes.ENUM('PENDIENTE', 'APROBADO', 'RECHAZADO', 'CANCELADO', 'REEMBOLSADO'),
        allowNull: false,
        defaultValue: 'PENDIENTE'
    },
    fecha_pago: {
        type: DataTypes.DATE,
        allowNull: true,
    }
}, {
    tableName: 'pagos',
    timestamps: false, // El UML no indica createdAt/updatedAt
    paranoid: false    // El UML no indica borrado lógico para Pagos
});

module.exports = Pago;