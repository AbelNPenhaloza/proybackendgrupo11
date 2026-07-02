const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Pago = sequelize.define('Pago', {
    pago_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    monto: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    metodo_pago: {
        type: DataTypes.ENUM('EFECTIVO', 'MERCADO_PAGO', 'TRANSFERENCIA'),
        allowNull: false,
        defaultValue: 'EFECTIVO'
    },
    estado: {
        type: DataTypes.ENUM('PENDIENTE', 'APROBADO', 'RECHAZADO', 'REEMBOLSADO'),
        allowNull: false,
        defaultValue: 'PENDIENTE'
    },
    fecha_pago: {
        type: DataTypes.DATE,
        allowNull: true, // Será null hasta que el pago se apruebe
    },
    // Estos campos son específicos para integraciones (ej: MercadoPago)
    transaccion_id: {
        type: DataTypes.STRING,
        allowNull: true,
        description: 'ID de la transacción devuelto por MercadoPago o número de comprobante'
    }
}, {
    tableName: 'pagos',
    timestamps: true,
    paranoid: true, // Mantenemos el estándar de borrado lógico
});

module.exports = Pago;