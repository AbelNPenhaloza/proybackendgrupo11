const { Servicio } = require('../models');

// Crear un nuevo servicio
const crearServicio = async (req, res) => {
    try {
        const { nombre, descripcion, foto_url, duracion_minutos, precio } = req.body;
        
        const nuevoServicio = await Servicio.create({
            nombre,
            descripcion,
            foto_url,
            duracion_minutos,
            precio
        });
        
        res.status(201).json({ 
            mensaje: 'Servicio creado exitosamente', 
            servicio: nuevoServicio 
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el servicio', detalle: error.message });
    }
};

// Obtener todos los servicios activos
const obtenerServicios = async (req, res) => {
    try {
        const servicios = await Servicio.findAll({
            where: { activo: true }
        });
        res.status(200).json(servicios);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los servicios', detalle: error.message });
    }
};

// Obtener un servicio por ID
const obtenerServicioPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const servicio = await Servicio.findByPk(id);
        
        if (!servicio) {
            return res.status(404).json({ error: 'Servicio no encontrado' });
        }
        
        res.status(200).json(servicio);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el servicio', detalle: error.message });
    }
};

// Actualizar un servicio (Edición parcial)
const actualizarServicio = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, foto_url, duracion_minutos, precio, activo } = req.body;

        const servicio = await Servicio.findByPk(id);
        
        if (!servicio) {
            return res.status(404).json({ error: 'Servicio no encontrado' });
        }

        // Si no se envía un campo en el body, se mantiene el valor actual
        servicio.nombre = nombre ?? servicio.nombre;
        servicio.descripcion = descripcion ?? servicio.descripcion;
        servicio.foto_url = foto_url ?? servicio.foto_url;
        servicio.duracion_minutos = duracion_minutos ?? servicio.duracion_minutos;
        servicio.precio = precio ?? servicio.precio;
        servicio.activo = activo ?? servicio.activo;

        await servicio.save();
        
        res.status(200).json({ mensaje: 'Servicio actualizado correctamente', servicio });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el servicio', detalle: error.message });
    }
};

// Eliminar un servicio (Soft delete)
const eliminarServicio = async (req, res) => {
    try {
        const { id } = req.params;
        const servicio = await Servicio.findByPk(id);
        
        if (!servicio) {
            return res.status(404).json({ error: 'Servicio no encontrado' });
        }

        // Sequelize agrega la fecha en deletedAt por el paranoid: true
        await servicio.destroy(); 
        
        res.status(200).json({ mensaje: 'Servicio eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el servicio', detalle: error.message });
    }
};
// Restaurar un servicio eliminado (Solo Admin)
const restaurarServicio = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Buscamos incluso entre los eliminados lógicamente
        const servicio = await Servicio.findByPk(id, { paranoid: false });
        
        if (!servicio) {
            return res.status(404).json({ error: 'Servicio no encontrado en la papelera' });
        }

        if (!servicio.deletedAt) {
            return res.status(400).json({ error: 'El servicio no estaba eliminado' });
        }

        await servicio.restore();
        
        res.status(200).json({ mensaje: 'Servicio restaurado correctamente', servicio });
    } catch (error) {
        res.status(500).json({ error: 'Error al restaurar el servicio', detalle: error.message });
    }
};

module.exports = {
    crearServicio,
    obtenerServicios,
    obtenerServicioPorId,
    actualizarServicio,
    eliminarServicio,
    restaurarServicio
};
   