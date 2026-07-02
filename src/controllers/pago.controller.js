const { Pago, Turno } = require('../models');

// POST /api/pagos
async function registrarPago(req, res) {
    try {
        const { turno_id, monto, metodo_pago, transaccion_id } = req.body;
        const turno = await Turno.findByPk(turno_id);
        if (!turno) return res.status(404).json({ error: 'Turno no encontrado' });

        const nuevoPago = await Pago.create({
            turno_id,
            monto,
            metodo_pago,
            transaccion_id,
            estado: metodo_pago === 'EFECTIVO' ? 'APROBADO' : 'PENDIENTE',
            fecha_pago: metodo_pago === 'EFECTIVO' ? new Date() : null
        });
        res.status(201).json(nuevoPago);
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar el pago' });
    }
}

// PUT /api/pagos/:id/estado
// Método para actualizar el estado (ej: de PENDIENTE a APROBADO tras notificación de MP)
async function actualizarEstadoPago(req, res) {
    try {
        const { id } = req.params;
        const { estado } = req.body; // 'APROBADO', 'RECHAZADO', etc.
        
        const pago = await Pago.findByPk(id);
        if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });

        pago.estado = estado;
        if (estado === 'APROBADO') pago.fecha_pago = new Date();
        
        await pago.save();
        res.status(200).json(pago);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar estado del pago' });
    }
}

// GET /api/pagos/:turno_id
async function obtenerPagoPorTurno(req, res) {
    try {
        const pago = await Pago.findOne({ where: { turno_id: req.params.turno_id } });
        if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });
        res.status(200).json(pago);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el pago' });
    }
}

// DELETE /api/pagos/:id
// Útil si se registra un pago erróneo
async function eliminarPago(req, res) {
    try {
        const pago = await Pago.findByPk(req.params.id);
        if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });
        await pago.destroy();
        res.status(200).json({ mensaje: 'Pago eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el pago' });
    }
}
// POST /api/pagos/:id/restaurar
// Restaura un pago que había sido eliminado lógicamente
async function restaurarPago(req, res) {
    try {
        const { id } = req.params;
        
        // Buscamos incluso entre los eliminados
        const pago = await Pago.findByPk(id, { paranoid: false });
        
        if (!pago) {
            return res.status(404).json({ error: 'Pago no encontrado en la papelera' });
        }

        if (!pago.deletedAt) {
            return res.status(400).json({ error: 'El pago no estaba eliminado' });
        }

        await pago.restore();
        
        res.status(200).json({ mensaje: 'Pago restaurado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al restaurar el pago' });
    }
}

module.exports = {
    registrarPago,
    actualizarEstadoPago,
    obtenerPagoPorTurno,
    eliminarPago,
    restaurarPago
};
