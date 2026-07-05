const { Turno, Disponibilidad, Barbero, Usuario, Servicio } = require('../models');
const { Op } = require('sequelize');
const { enviarConfirmacionTurno, enviarCancelacionTurno } = require('../services/mail.service');

// 1. Crear un nuevo turno
const agendarTurno = async (req, res) => {
    try {
        const { fecha, hora_inicio, notas, barbero_id, servicio_id } = req.body;
        let { cliente_id } = req.body;

        // Seguridad: Si el usuario es CLIENTE, forzamos su propio ID para evitar que agende para otros
        if (req.usuario && req.usuario.rol === 'CLIENTE') {
            cliente_id = req.usuario.usuario_id;
        }

        if (!cliente_id || !barbero_id || !servicio_id || !fecha || !hora_inicio) {
            return res.status(400).json({ error: 'Faltan datos obligatorios para agendar el turno' });
        }

        // VALIDACIÓN 1: ¿El barbero trabaja ese día y en ese horario?
        const diaSemanaSolicitado = new Date(fecha).getUTCDay();

        const disponibilidad = await Disponibilidad.findOne({
            where: {
                barbero_id: barbero_id,
                dia_semana: diaSemanaSolicitado,
                activo: true,
                hora_inicio: {
                    [Op.lte]: hora_inicio
                },
                hora_fin: {
                    [Op.gt]: hora_inicio
                }
            }
        });

        if (!disponibilidad) {
            return res.status(400).json({
                error: 'Fuera de horario',
                detalle: 'El barbero no trabaja en ese día u horario.'
            });
        }

        // VALIDACIÓN 2: Prevenir Double-Booking (Superposición)
        const turnoSuperpuesto = await Turno.findOne({
            where: {
                barbero_id: barbero_id,
                fecha: fecha,
                hora_inicio: hora_inicio,
                estado: {
                    [Op.in]: ['PENDIENTE', 'CONFIRMADO']
                }
            }
        });

        if (turnoSuperpuesto) {
            return res.status(409).json({
                error: 'Horario no disponible',
                detalle: 'El barbero ya tiene un turno agendado en ese horario exacto.'
            });
        }

        // Si pasó las validaciones, creamos el turno
        const nuevoTurno = await Turno.create({
            fecha,
            hora_inicio,
            notas,
            cliente_id,
            barbero_id,
            servicio_id,
            estado: 'PENDIENTE' // Todo turno nace como pendiente
        });

        // Mandamos el mail de confirmación. Si falla, no debe romper la
        // respuesta -- el turno ya está creado en la base, eso es lo
        // importante. El mail es un "extra" que puede fallar sin problema.
        try {
            const cliente = await Usuario.findByPk(cliente_id);
            const barberoInfo = await Barbero.findByPk(barbero_id);
            const servicioInfo = await Servicio.findByPk(servicio_id);
            await enviarConfirmacionTurno(nuevoTurno, cliente, barberoInfo, servicioInfo);
        } catch (errorMail) {
            console.error('No se pudo enviar el mail de confirmación:', errorMail.message);
        }

        res.status(201).json({
            mensaje: 'Turno agendado exitosamente',
            turno: nuevoTurno
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al agendar el turno', detalle: error.message });
    }
};

// 2. Obtener todos los turnos -- FILTRADO por rol.
// ADMINISTRADOR y RECEPCIONISTA ven todos (necesitan la vista completa
// para gestionar la agenda del local). CLIENTE solo ve los suyos.
// BARBERO solo ve los que le fueron asignados a él.
const obtenerTurnos = async (req, res) => {
    try {
        const { rol, usuario_id } = req.usuario;
        let condicionWhere = {};

        if (rol === 'CLIENTE') {
            condicionWhere.cliente_id = usuario_id;
        } else if (rol === 'BARBERO') {
            const perfilBarbero = await Barbero.findOne({ where: { usuario_id } });
            if (!perfilBarbero) {
                return res.status(200).json([]);
            }
            condicionWhere.barbero_id = perfilBarbero.barbero_id;
        }
        // ADMINISTRADOR y RECEPCIONISTA: condicionWhere queda vacío, ven todo.

        const turnos = await Turno.findAll({ where: condicionWhere });
        res.status(200).json(turnos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los turnos', detalle: error.message });
    }
};

// 3. Obtener un turno específico por ID -- con el mismo control de dueño
// que usamos en actualizarTurno, para que nadie pueda ver el turno de
// otra persona adivinando el ID.
const obtenerTurnoPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const { rol, usuario_id } = req.usuario;

        const turno = await Turno.findByPk(id);

        if (!turno) {
            return res.status(404).json({ error: 'Turno no encontrado' });
        }

        if (rol === 'CLIENTE' && turno.cliente_id !== usuario_id) {
            return res.status(403).json({ error: 'No tenés permiso para ver este turno' });
        }

        if (rol === 'BARBERO') {
            const perfilBarbero = await Barbero.findOne({ where: { usuario_id } });
            if (!perfilBarbero || turno.barbero_id !== perfilBarbero.barbero_id) {
                return res.status(403).json({ error: 'No tenés permiso para ver este turno' });
            }
        }
        // ADMINISTRADOR y RECEPCIONISTA pueden ver cualquier turno.

        res.status(200).json(turno);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el turno', detalle: error.message });
    }
};

// 4. Cambiar el estado o reprogramar
const actualizarTurno = async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha, hora_inicio, estado, notas } = req.body;

        // Usar el rol real del usuario desde el token
        const rolUsuario = req.usuario.rol;
        const usuarioIdAutenticado = req.usuario.usuario_id;

        const turno = await Turno.findByPk(id);
        if (!turno) return res.status(404).json({ error: 'Turno no encontrado' });

        // Control de dueño (Seguridad)
        if (rolUsuario === 'CLIENTE' && turno.cliente_id !== usuarioIdAutenticado) {
            return res.status(403).json({ error: 'No tienes permiso para modificar este turno' });
        }

        // Política de cancelación (Solo para clientes)
        if (estado === 'CANCELADO' && rolUsuario === 'CLIENTE') {
            const fechaHoraTurno = new Date(`${turno.fecha}T${turno.hora_inicio}`);
            const ahora = new Date();
            const diferenciaHoras = (fechaHoraTurno - ahora) / (1000 * 60 * 60);

            if (diferenciaHoras < 6) {
                return res.status(403).json({
                    error: 'Políticas de cancelación',
                    detalle: 'No podés cancelar con menos de 6 horas de anticipación.'
                });
            }
        }

        turno.fecha = fecha ?? turno.fecha;
        turno.hora_inicio = hora_inicio ?? turno.hora_inicio;
        turno.estado = estado ?? turno.estado;
        turno.notas = notas ?? turno.notas;

        await turno.save();

        // Si el turno quedó cancelado, avisamos por mail. Mismo criterio
        // que en agendarTurno: si el mail falla, no rompe la respuesta.
        if (turno.estado === 'CANCELADO') {
            try {
                const cliente = await Usuario.findByPk(turno.cliente_id);
                const barberoInfo = await Barbero.findByPk(turno.barbero_id);
                const servicioInfo = await Servicio.findByPk(turno.servicio_id);
                await enviarCancelacionTurno(turno, cliente, barberoInfo, servicioInfo);
            } catch (errorMail) {
                console.error('No se pudo enviar el mail de cancelación:', errorMail.message);
            }
        }

        res.status(200).json({ mensaje: 'Turno actualizado correctamente', turno });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar', detalle: error.message });
    }
};

// 5. Eliminar un turno de la base de datos (Borrado lógico)
const eliminarTurno = async (req, res) => {
    try {
        const { id } = req.params;
        const turno = await Turno.findByPk(id);

        if (!turno) {
            return res.status(404).json({ error: 'Turno no encontrado' });
        }

        // Gracias al paranoid: true en el modelo, esto no lo borra del todo,
        // solo le pone fecha de eliminación (deletedAt).
        await turno.destroy();

        res.status(200).json({ mensaje: 'Turno eliminado del sistema' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el turno', detalle: error.message });
    }
};

// 6. Restaurar un turno eliminado (Solo Admin/Recepcionista)
const restaurarTurno = async (req, res) => {
    try {
        const { id } = req.params;

        // El secreto acá es pasar { paranoid: false } para que Sequelize
        // incluya en la búsqueda a los registros que tienen fecha en deletedAt
        const turno = await Turno.findByPk(id, { paranoid: false });

        if (!turno) {
            return res.status(404).json({ error: 'Turno no encontrado en la papelera' });
        }

        // Si el turno no está eliminado, no hacemos nada
        if (!turno.deletedAt) {
            return res.status(400).json({ error: 'El turno no estaba eliminado' });
        }

        // El método nativo restore() limpia el campo deletedAt
        await turno.restore();

        res.status(200).json({ mensaje: 'Turno restaurado correctamente', turno });
    } catch (error) {
        res.status(500).json({ error: 'Error al restaurar el turno', detalle: error.message });
    }
};

module.exports = {
    agendarTurno,
    obtenerTurnos,
    obtenerTurnoPorId,
    actualizarTurno,
    eliminarTurno,
    restaurarTurno
};