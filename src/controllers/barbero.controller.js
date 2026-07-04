const { Barbero, Usuario, Disponibilidad } = require('../models');

// POST /api/barberos
// Crea el perfil de Barbero para un Usuario que YA existe y ya tiene
// rol BARBERO (ese Usuario se crea antes, con POST /api/auth/usuarios).
async function crearBarbero(req, res) {
  try {
    const { usuario_id, nombre_completo, especialidad, foto_url } = req.body;

    if (!usuario_id || !nombre_completo || !especialidad) {
      return res.status(400).json({ error: 'Faltan campos obligatorios (usuario_id, nombre_completo, especialidad)' });
    }

    const usuario = await Usuario.findByPk(usuario_id);
    if (!usuario || usuario.rol !== 'BARBERO') {
      return res.status(400).json({ error: 'El usuario_id no existe o no tiene rol BARBERO' });
    }

    const yaTienePerfil = await Barbero.findOne({ where: { usuario_id } });
    if (yaTienePerfil) {
      return res.status(409).json({ error: 'Este usuario ya tiene un perfil de Barbero creado' });
    }

    const nuevoBarbero = await Barbero.create({
      usuario_id,
      nombre_completo,
      especialidad,
      foto_url,
      activo: true // Por defecto, al crearlo, está activo
    });

    res.status(201).json(nuevoBarbero);
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al crear el barbero' });
  }
}

// GET /api/barberos
// Pública: cualquiera puede ver el catálogo de barberos, sin loguearse.
async function listarBarberos(req, res) {
  try {
    // Solo mostramos los barberos que estén activos
    const barberos = await Barbero.findAll({ where: { activo: true } });
    res.status(200).json(barberos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar barberos' });
  }
}

// GET /api/barberos/:id
// Trae el barbero junto con su disponibilidad (mismo patrón que
// sectorCtrl.getSectores del material de cátedra: se usa "include").
async function obtenerBarbero(req, res) {
  try {
    const barbero = await Barbero.findByPk(req.params.id, {
      include: [{ model: Disponibilidad, as: 'disponibilidad' }],
    });

    if (!barbero) {
      return res.status(404).json({ error: 'Barbero no encontrado' });
    }

    res.status(200).json(barbero);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el barbero' });
  }
}

// PUT /api/barberos/:id
// Protegida: solo ADMINISTRADOR (se valida en la ruta con verificarRol).
async function editarBarbero(req, res) {
  try {
    const barbero = await Barbero.findByPk(req.params.id);
    if (!barbero) {
      return res.status(404).json({ error: 'Barbero no encontrado' });
    }

    const { nombre_completo, especialidad, foto_url } = req.body;

    // Actualizamos solo lo que vino en el body, sin pisar lo demás.
    await barbero.update({
      nombre_completo: nombre_completo ?? barbero.nombre_completo,
      especialidad: especialidad ?? barbero.especialidad,
      foto_url: foto_url ?? barbero.foto_url,
    });

    res.status(200).json(barbero);
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al editar el barbero' });
  }
}

// NUEVA FUNCIÓN: Cambiar el estado activo (Licencias, vacaciones)
// PUT /api/barberos/:id/estado
async function alternarEstadoBarbero(req, res) {
  try {
      const { id } = req.params;
      const { activo } = req.body;

      if (activo === undefined) {
          return res.status(400).json({ error: 'Se requiere el campo activo (true o false)' });
      }

      const barbero = await Barbero.findByPk(id);
      
      if (!barbero) {
          return res.status(404).json({ error: 'Barbero no encontrado' });
      }

      barbero.activo = activo;
      await barbero.save();

      res.status(200).json({ 
          mensaje: `Barbero ${activo ? 'activado' : 'desactivado'} correctamente`, 
          barbero 
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al cambiar el estado del barbero' });
  }
}


// DELETE /api/barberos/:id
// Baja definitiva. Usamos Soft Delete gracias a paranoid: true en el modelo.
async function eliminarBarbero(req, res) {
  try {
    const barbero = await Barbero.findByPk(req.params.id);
    if (!barbero) {
      return res.status(404).json({ error: 'Barbero no encontrado' });
    }

    // Esto establece el deletedAt, ocultándolo de búsquedas normales.
    await barbero.destroy();

    res.status(200).json({ mensaje: 'Barbero eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el barbero' });
  }
}

// POST /api/barberos/:id/disponibilidad
async function agregarDisponibilidad(req, res) {
  try {
    const barbero = await Barbero.findByPk(req.params.id);
    if (!barbero) {
      return res.status(404).json({ error: 'Barbero no encontrado' });
    }

    const { dia_semana, hora_inicio, hora_fin } = req.body;

    if (dia_semana === undefined || !hora_inicio || !hora_fin) {
      return res.status(400).json({ error: 'Faltan campos obligatorios (dia_semana, hora_inicio, hora_fin)' });
    }

    if (dia_semana < 0 || dia_semana > 6) {
      return res.status(400).json({ error: 'dia_semana debe estar entre 0 (domingo) y 6 (sábado)' });
    }

    if (hora_fin <= hora_inicio) {
      return res.status(400).json({ error: 'hora_fin debe ser posterior a hora_inicio' });
    }

    const nuevaDisponibilidad = await Disponibilidad.create({
      barbero_id: barbero.barbero_id, // Usar barbero_id, asumiendo que es la PK en el modelo Barbero
      dia_semana,
      hora_inicio,
      hora_fin,
    });

    res.status(201).json(nuevaDisponibilidad);
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al agregar la disponibilidad' });
  }
}

// GET /api/barberos/:id/disponibilidad
async function listarDisponibilidad(req, res) {
  try {
    const disponibilidad = await Disponibilidad.findAll({
      where: { barbero_id: req.params.id, activo: true },
    });
    res.status(200).json(disponibilidad);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al listar la disponibilidad' });
  }
}

// DELETE /api/barberos/:id/disponibilidad/:disponibilidadId
async function eliminarDisponibilidad(req, res) {
  try {
    const disponibilidad = await Disponibilidad.findByPk(req.params.disponibilidadId);

    if (!disponibilidad || disponibilidad.barbero_id !== req.params.id) {
      return res.status(404).json({ error: 'Disponibilidad no encontrada para este barbero' });
    }

    await disponibilidad.destroy(); // Borrado real (ver design-003.md)

    res.status(200).json({ mensaje: 'Disponibilidad eliminada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar la disponibilidad' });
  }
}

// Restaurar un perfil de barbero eliminado (Solo Admin)
const restaurarBarbero = async (req, res) => {
    try {
        const { id } = req.params;
        
        const barbero = await Barbero.findByPk(id, { paranoid: false });
        
        if (!barbero) {
            return res.status(404).json({ error: 'Barbero no encontrado en la papelera' });
        }

        if (!barbero.deletedAt) {
            return res.status(400).json({ error: 'El perfil del barbero no estaba eliminado' });
        }

        await barbero.restore();
        
        res.status(200).json({ mensaje: 'Perfil de barbero restaurado correctamente', barbero });
    } catch (error) {
        res.status(500).json({ error: 'Error al restaurar el barbero', detalle: error.message });
    }
};

module.exports = {
  crearBarbero,
  listarBarberos,
  obtenerBarbero,
  editarBarbero,
  alternarEstadoBarbero, 
  eliminarBarbero,       
  agregarDisponibilidad,
  listarDisponibilidad,
  eliminarDisponibilidad,
  restaurarBarbero       
};