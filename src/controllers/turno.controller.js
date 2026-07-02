const { Turno } = require('../models');

// 1. Crear un nuevo turno
const agendarTurno = async (req, res) => {
    try {
        const { fecha, hora_inicio, notas, cliente_id, barbero_id, servicio_id } = req.body;
        
        const nuevoTurno = await Turno.create({
            fecha,
            hora_inicio,
            notas,
            cliente_id,
            barbero_id,
            servicio_id,
            estado: 'PENDIENTE' // Todo turno nace como pendiente
        });
        
        res.status(201).json({ 
            mensaje: 'Turno agendado exitosamente', 
            turno: nuevoTurno 
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al agendar el turno', detalle: error.message });
    }
};

// 2. Obtener todos los turnos (ideal para la vista de administrador o del barbero)
const obtenerTurnos = async (req, res) => {
    try {
        const turnos = await Turno.findAll();
        res.status(200).json(turnos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los turnos', detalle: error.message });
    }
};

// 3. Obtener un turno específico por ID
const obtenerTurnoPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const turno = await Turno.findByPk(id);
        
        if (!turno) {
            return res.status(404).json({ error: 'Turno no encontrado' });
        }
        
        res.status(200).json(turno);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el turno', detalle: error.message });
    }
};

// 4. Cambiar el estado o reprogramar (Actualización parcial)
const actualizarTurno = async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha, hora_inicio, estado, notas } = req.body;
        // Simularemos que extraemos el ROL de quien hace la petición desde el token de autenticación
        // const rolUsuario = req.usuario.rol; (Lo descomentarás cuando tengas JWT)
        const rolUsuario = 'CLIENTE'; // Para probar. En la vida real, vendrá del middleware

        const turno = await Turno.findByPk(id);
        if (!turno) {
            return res.status(404).json({ error: 'Turno no encontrado' });
        }

        // REGLA DE NEGOCIO: Límite de cancelación para clientes
        if (estado === 'CANCELADO' && rolUsuario === 'CLIENTE') {
            // Unimos la fecha (YYYY-MM-DD) y hora (HH:MM:SS) del turno y lo convertimos a un objeto Date
            const fechaHoraTurno = new Date(`${turno.fecha}T${turno.hora_inicio}`);
            const ahora = new Date(); // La hora exacta de este momento
            
            // Calculamos la diferencia en milisegundos y la pasamos a horas
            const diferenciaHoras = (fechaHoraTurno - ahora) / (1000 * 60 * 60);

            // Si faltan menos de 6 horas, bloqueamos la cancelación
            if (diferenciaHoras < 6 && diferenciaHoras > 0) {
                return res.status(403).json({ 
                    error: 'Políticas de cancelación', 
                    detalle: 'No podés cancelar el turno con menos de 6 horas de anticipación. Por favor, comunícate con la recepcionista.' 
                });
            }
        }

        // Si pasa la validación (o si es el admin/barbero quien cancela), actualizamos normal
        turno.fecha = fecha ?? turno.fecha;
        turno.hora_inicio = hora_inicio ?? turno.hora_inicio;
        turno.estado = estado ?? turno.estado;
        turno.notas = notas ?? turno.notas;

        await turno.save();
        res.status(200).json({ mensaje: 'Turno actualizado correctamente', turno });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el turno', detalle: error.message });
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
   