const { Pago, Turno, Servicio } = require('../models');
const { generarPreferenciaMP } = require('../services/mercadopago.service');

// POST /api/pagos
const registrarPago = async (req, res) => {
    try {
        const { turno_id, monto_total, metodo_pago } = req.body;

        const turno = await Turno.findByPk(turno_id, {
            include: [{ model: Servicio, as: 'servicio' }]
        });
        
        if (!turno) return res.status(404).json({ error: 'Turno no encontrado' });

        // Creamos el pago en la base de datos primero
        const nuevoPago = await Pago.create({
            turno_id,
            monto_total,
            metodo_pago,
            estado: metodo_pago === 'EFECTIVO' ? 'APROBADO' : 'PENDIENTE',
            fecha_pago: metodo_pago === 'EFECTIVO' ? new Date() : null
        });

        // Si el cliente elige pagar con MercadoPago, generamos la preferencia
        if (metodo_pago === 'MERCADO_PAGO') {
            const nombreServicio = turno.servicio ? turno.servicio.nombre : 'Servicio Reservado';
            
            // Llamamos a nuestro servicio externo
            const preferenciaId = await generarPreferenciaMP(
                nuevoPago.pago_id, 
                monto_total, 
                nombreServicio
            );

            // Guardamos el ID de la preferencia en nuestro registro
            nuevoPago.mp_preferencia_id = preferenciaId;
            await nuevoPago.save();
        }

        res.status(201).json(nuevoPago);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al registrar el pago' });
    }
};

// POST /api/pagos/webhook
const procesarWebhookMP = async (req, res) => {
    try {
        const { type, data } = req.body; 

        if (type === 'payment') {
            const pago_id_referencia = req.body.data?.external_reference; 
            
            if (pago_id_referencia) {
                const pago = await Pago.findByPk(pago_id_referencia);
                if (pago) {
                    pago.estado = 'APROBADO';
                    pago.fecha_pago = new Date();
                    await pago.save();
                }
            }
        }

        res.status(200).send('Webhook recibido'); 
    } catch (error) {
        console.error('Error en Webhook MP:', error);
        res.status(500).send('Error interno');
    }
};

// GET /api/pagos/:turno_id
const obtenerPagoPorTurno = async (req, res) => {
    try {
        const { turno_id } = req.params;
        const pago = await Pago.findOne({ where: { turno_id } });
        
        if (!pago) {
            return res.status(404).json({ error: 'No se encontró un pago registrado para este turno' });
        }
        
        res.status(200).json(pago);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el pago', detalle: error.message });
    }
};

// PUT /api/pagos/:id/estado
const actualizarEstadoPago = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        const pago = await Pago.findByPk(id);
        if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });

        pago.estado = estado ?? pago.estado;
        
        // Si lo aprueban manualmente, le ponemos la fecha actual
        if (estado === 'APROBADO' && !pago.fecha_pago) {
            pago.fecha_pago = new Date();
        }

        await pago.save();
        res.status(200).json({ mensaje: 'Estado del pago actualizado', pago });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el pago', detalle: error.message });
    }
};

// DELETE /api/pagos/:id
const eliminarPago = async (req, res) => {
    try {
        const { id } = req.params;
        const pago = await Pago.findByPk(id);
        
        if (!pago) return res.status(404).json({ error: 'Pago no encontrado' });

        await pago.destroy(); 
        
        res.status(200).json({ mensaje: 'Pago eliminado del sistema' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el pago', detalle: error.message });
    }
};

// POST /api/pagos/:id/restaurar
const restaurarPago = async (req, res) => {
    try {
        // Nota: Como el modelo Pago no tiene paranoid: true según el UML, 
        // destroy() hace un borrado físico. Este método se deja por compatibilidad 
        // con tus rutas, pero retornará un mensaje acorde.
        res.status(400).json({ 
            error: 'Operación no soportada', 
            detalle: 'El historial de pagos no utiliza borrado lógico, no se puede restaurar.' 
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al restaurar el pago', detalle: error.message });
    }
};

module.exports = {
    registrarPago,
    procesarWebhookMP,
    obtenerPagoPorTurno,
    actualizarEstadoPago,
    eliminarPago,
    restaurarPago
};